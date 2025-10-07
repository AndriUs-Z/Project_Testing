const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();


app.use(cors());
app.use(bodyParser.json());


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "project_testing"
});

db.connect(err => {
    if (err) {
        console.error("Database connection failed:", err);
        console.log("Please make sure:");
        console.log("1. MySQL server is running");
        console.log("2. Database 'project_testing' exists");
        process.exit(1);
    }
    console.log("MySQL Connected!");
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'rerolllid1@gmail.com',
        pass: 'hatgaejnfdmpkiqx'            
    }
});

//สร้าง OTP 6 หลัก
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, otp, purpose) {
    let subject = '';
    let message = '';
    
    if (purpose === 'registration') {
        subject = 'ยืนยันการสมัครสมาชิก';
        message = `รหัส OTP สำหรับยืนยันการสมัครสมาชิก: ${otp}\n\nรหัสนี้จะหมดอายุใน 10 นาที`;
    } else if (purpose === 'password_reset') {
        subject = 'รีเซ็ตรหัสผ่าน';
        message = `รหัส OTP สำหรับรีเซ็ตรหัสผ่าน: ${otp}\n\nรหัสนี้จะหมดอายุใน 10 นาที`;
    } else if (purpose === 'login_verification') {
        subject = 'ยืนยันการเข้าสู่ระบบ';
        message = `รหัส OTP สำหรับยืนยันการเข้าสู่ระบบ: ${otp}\n\nรหัสนี้จะหมดอายุใน 10 นาที`;
    }
    
    const mailOptions = {
        from: 'rerol11id1@gmail.com',
        to: email,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
                    <h2 style="color: white; margin: 0;">รหัสยืนยัน OTP</h2>
                </div>
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                        ${message}
                    </p>
                    <div style="background: white; border: 2px solid #6366f1; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #6366f1; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
                    </div>
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">
                        ⚠️ หากคุณไม่ได้ขอรหัสนี้ กรุณาเพิกเฉยต่ออีเมลนี้
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${userEmail} (${purpose})`);
        return true;
    } catch (error) {
        console.error("Email sending failed:", error);
        return false;
    }
}

// API: ส่ง OTP
app.post("/send-otp", async (req, res) => {
    try {
        const { email, purpose } = req.body;
        
        if (!email || !purpose) {
            return res.status(400).json({
                message: "กรุณาระบุ email และ purpose"
            });
        }
        
        const validPurposes = ['registration', 'password_reset', 'login_verification'];
        if (!validPurposes.includes(purpose)) {
            return res.status(400).json({
                message: "Purpose ไม่ถูกต้อง"
            });
        }
        
        // ตรวจสอบ email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "รูปแบบ email ไม่ถูกต้อง"
            });
        }
        
        // สร้าง OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
        // ลบ OTP เก่าที่ยังไม่ได้ใช้
        const deleteOldOtpSql = "DELETE FROM otp_codes WHERE email = ? AND purpose = ? AND used = FALSE";
        
        db.query(deleteOldOtpSql, [email, purpose], async (err) => {
            if (err) {
                console.error("Error deleting old OTP:", err);
                return res.status(500).json({
                    message: "เกิดข้อผิดพลาดในระบบ"
                });
            }
            
            // บันทึก OTP ใหม่
            const insertOtpSql = "INSERT INTO otp_codes (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)";
            
            db.query(insertOtpSql, [email, otp, purpose, expiresAt], async (err, result) => {
                if (err) {
                    console.error("Error inserting OTP:", err);
                    return res.status(500).json({
                        message: "เกิดข้อผิดพลาดในการบันทึก OTP"
                    });
                }
                
                // ส่ง email
                const emailSent = await sendOTPEmail(email, otp, purpose);
                
                if (emailSent) {
                    res.json({
                        message: "ส่ง OTP ไปยัง email เรียบร้อยแล้ว",
                        otpId: result.insertId
                    });
                } else {
                    res.status(500).json({
                        message: "ไม่สามารถส่ง email ได้ กรุณาลองใหม่อีกครั้ง"
                    });
                }
            });
        });
        
    } catch (error) {
        console.error("Send OTP error:", error);
        res.status(500).json({
            message: "เกิดข้อผิดพลาดในระบบ"
        });
    }
});

// API: ตรวจสอบ OTP
app.post("/verify-otp", (req, res) => {
    try {
        const { email, otp, purpose } = req.body;
        
        if (!email || !otp || !purpose) {
            return res.status(400).json({
                message: "กรุณาระบุข้อมูลให้ครบถ้วน"
            });
        }
        
        const sql = `
            SELECT * FROM otp_codes 
            WHERE email = ? AND otp_code = ? AND purpose = ? 
            AND expires_at > NOW() AND used = FALSE
            ORDER BY created_at DESC LIMIT 1
        `;
        
        db.query(sql, [email, otp, purpose], (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({
                    message: "เกิดข้อผิดพลาดในระบบ"
                });
            }
            
            if (results.length === 0) {
                return res.status(400).json({
                    message: "รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว"
                });
            }
            
            // อัพเดทสถานะ OTP ว่าใช้แล้ว
            const updateSql = "UPDATE otp_codes SET used = TRUE WHERE id = ?";
            
            db.query(updateSql, [results[0].id], (updateErr) => {
                if (updateErr) {
                    console.error("Error updating OTP:", updateErr);
                    return res.status(500).json({
                        message: "เกิดข้อผิดพลาดในการอัพเดท OTP"
                    });
                }
                
                console.log(`OTP verified for ${email} (${purpose})`);
                res.json({
                    message: "ยืนยัน OTP สำเร็จ",
                    verified: true
                });
            });
        });
        
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({
            message: "เกิดข้อผิดพลาดในระบบ"
        });
    }
});

// API: Register
app.post("/register", async (req, res) => {
    try {
        const { username, password, email } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        }

        const checkUserSql = "SELECT id, username, email FROM userdata WHERE username = ? OR email = ?";
        db.query(checkUserSql, [username, email], async (err, results) => {
            if (err) return res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบฐานข้อมูล" });

            if (results.length > 0) {
                return res.status(409).json({ message: "มีผู้ใช้งานนี้อยู่แล้ว" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const insertSql = "INSERT INTO userdata (username, password, email, created_at) VALUES (?, ?, ?, NOW())";

            db.query(insertSql, [username, hashedPassword, email], async (err, result) => {
                if (err) return res.status(500).json({ message: "ไม่สามารถสร้างบัญชีได้" });

                const otp = generateOTP();
                const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

                const insertOtpSql = "INSERT INTO otp_codes (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)";
                db.query(insertOtpSql, [email, otp, "registration", expiresAt], async (err2) => {
                    if (!err2) await sendOTPEmail(email, otp, "registration");
                });

                res.status(201).json({
                    message: "สร้างบัญชีเรียบร้อยแล้ว โปรดยืนยัน OTP",
                    userId: result.insertId,
                    email
                });
            });
        });
    } catch {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
});

// Forgot Password
app.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) return res.status(400).json({ message: "กรุณาระบุ email" });

        const checkUserSql = "SELECT id FROM userdata WHERE email = ?";
        db.query(checkUserSql, [email], async (err, results) => {
            if (err) return res.status(500).json({ message: "Database error" });
            if (results.length === 0) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });

            const otp = generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            const insertOtpSql = "INSERT INTO otp_codes (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)";
            db.query(insertOtpSql, [email, otp, "password_reset", expiresAt], async (err2) => {
                if (err2) return res.status(500).json({ message: "Error saving OTP" });

                const emailSent = await sendOTPEmail(email, otp, "password_reset");
                if (emailSent) {
                    res.json({ message: "ส่ง OTP ไปยัง email เรียบร้อยแล้ว", email });
                } else {
                    res.status(500).json({ message: "ไม่สามารถส่ง email ได้" });
                }
            });
        });
    } catch {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
});


// API: Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                message: "กรุณากรอก email และ password"
            });
        }
        
        const sql = "SELECT id, username, password, email, is_verified FROM userdata WHERE email = ?";
        
        db.query(sql, [email], async (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({
                    message: "เกิดข้อผิดพลาดในระบบฐานข้อมูล"
                });
            }
            
            if (results.length === 0) {
                return res.status(401).json({
                    message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
                });
            }
            
            const user = results[0];
            
            try {
                const passwordMatch = await bcrypt.compare(password, user.password);
                
                if (!passwordMatch) {
                    return res.status(401).json({
                        message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
                    });
                }
                
                const updateLastLoginSql = "UPDATE userdata SET last_login = NOW() WHERE id = ?";
                db.query(updateLastLoginSql, [user.id]);
                
                console.log(`✅ User logged in: ${user.username} (ID: ${user.id})`);
                
                const { password: _, ...userWithoutPassword } = user;
                res.json({
                    message: "เข้าสู่ระบบสำเร็จ",
                    user: userWithoutPassword
                });
                
            } catch (compareError) {
                console.error("Password comparison error:", compareError);
                res.status(500).json({
                    message: "เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน"
                });
            }
        });
        
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "เกิดข้อผิดพลาดในระบบ"
        });
    }
});

// Health check
app.get("/health", (req, res) => {
    res.json({
        message: "Server is running",
        timestamp: new Date().toISOString()
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log("\n📋 Available endpoints:");
    console.log("POST /register - สมัครสมาชิก");
    console.log("POST /login - เข้าสู่ระบบ");
    console.log("POST /send-otp - ส่ง OTP");
    console.log("POST /verify-otp - ตรวจสอบ OTP");
    console.log("POST /verify-email - ยืนยัน email");
    console.log("GET /health - ตรวจสอบสถานะ server");
});