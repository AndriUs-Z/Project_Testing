const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

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
    if (err) throw err;
    console.log("MySQL Connected!");
});

// Register API
app.post("/register", (req, res) => {
    const { username, password, email } = req.body;
    const sql = "INSERT INTO userdata(username,password,email) VALUES (?,?,?)";
    db.query(sql, [username, password, email], (err, result) => {
        if (err) return res.status(500).json({ message: "Error: " + err.message });
        res.json({ message: "Register Successful" });
    });
});

// Login API
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM userdata WHERE username=? AND password=?";
    db.query(sql, [username, password], (err, results) => {
        if (err) return res.status(500).json({ message: "Error: " + err.message });
        if (results.length > 0) {
            res.json({ message: "Login Successful" });
        } else {
            res.status(401).json({ message: "Invalid Login" });
        }
    });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
