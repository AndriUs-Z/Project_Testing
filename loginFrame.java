package Java;

import javax.swing.*;
import java.sql.*;

public class loginFrame extends JFrame {
    private JTextField userField;
    private JPasswordField passField;

    public loginFrame() {
        initializeUI();
    }

    private void initializeUI() {
        setTitle("Login System");
        setSize(350, 250);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setLayout(null);

        JLabel userLabel = new JLabel("Username:");
        userLabel.setBounds(20, 30, 80, 25);
        userField = new JTextField();
        userField.setBounds(110, 30, 180, 25);

        JLabel passLabel = new JLabel("Password:");
        passLabel.setBounds(20, 70, 80, 25);
        passField = new JPasswordField();
        passField.setBounds(110, 70, 180, 25);

        JButton loginButton = new JButton("Login");
        loginButton.setBounds(50, 120, 100, 30);
        JButton regButton = new JButton("Register");
        regButton.setBounds(170, 120, 100, 30);

        add(userLabel);
        add(userField);
        add(passLabel);
        add(passField);
        add(loginButton);
        add(regButton);

        loginButton.addActionListener(e -> login());
        regButton.addActionListener(e -> openRegisterFrame());

        passField.addActionListener(e -> login());

        setVisible(true);
    }

    private void openRegisterFrame() {
        new RegisterFrame();
        dispose();
    }

    private void login() {
        String username = userField.getText().trim();
        String password = new String(passField.getPassword());

        if (username.isEmpty() || password.isEmpty()) {
            JOptionPane.showMessageDialog(this,
                    "Please enter both username and password!",
                    "Input Error",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }

        try (Connection conn = DBConnect.connect()) {

            String sql = "SELECT * FROM userdata WHERE username=? AND password=?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, username);
            stmt.setString(2, password);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                String userEmail = rs.getString("email");
                JOptionPane.showMessageDialog(this,
                        "Login Successful!\nWelcome: " + username + "\nEmail: " + userEmail,
                        "Success",
                        JOptionPane.INFORMATION_MESSAGE);
            } else {
                JOptionPane.showMessageDialog(this,
                        "Invalid username or password!",
                        "Login Failed",
                        JOptionPane.ERROR_MESSAGE);
            }
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this,
                    "Database Error: " + ex.getMessage(),
                    "Error",
                    JOptionPane.ERROR_MESSAGE);
            ex.printStackTrace();
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> new loginFrame());
    }
}

class RegisterFrame extends JFrame {
    private JTextField userField, emailField;
    private JPasswordField passField;

    public RegisterFrame() {
        initializeUI();
    }

    private void initializeUI() {
        setTitle("Register New User");
        setSize(350, 280);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setLayout(null);

        JLabel userLabel = new JLabel("Username:");
        userLabel.setBounds(20, 30, 80, 25);
        userField = new JTextField();
        userField.setBounds(110, 30, 180, 25);

        JLabel passLabel = new JLabel("Password:");
        passLabel.setBounds(20, 70, 80, 25);
        passField = new JPasswordField();
        passField.setBounds(110, 70, 180, 25);

        JLabel emailLabel = new JLabel("Email:");
        emailLabel.setBounds(20, 110, 80, 25);
        emailField = new JTextField();
        emailField.setBounds(110, 110, 180, 25);

        JButton submitButton = new JButton("Register");
        submitButton.setBounds(50, 160, 100, 30);
        JButton backButton = new JButton("Back to Login");
        backButton.setBounds(170, 160, 120, 30);

        add(userLabel);
        add(userField);
        add(passLabel);
        add(passField);
        add(emailLabel);
        add(emailField);
        add(submitButton);
        add(backButton);

        submitButton.addActionListener(e -> register());
        backButton.addActionListener(e -> backToLogin());

        setVisible(true);
    }

    private void backToLogin() {
        new loginFrame();
        dispose();
    }

    private void register() {
        String username = userField.getText().trim();
        String password = new String(passField.getPassword());
        String email = emailField.getText().trim();

        if (username.isEmpty() || password.isEmpty() || email.isEmpty()) {
            JOptionPane.showMessageDialog(this,
                    "Please fill in all fields!",
                    "Input Error",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }

        if (!isValidEmail(email)) {
            JOptionPane.showMessageDialog(this,
                    "Please enter a valid email address!",
                    "Invalid Email",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }

        try (Connection conn = DBConnect.connect()) {

            String checkSql = "SELECT COUNT(*) FROM userdata WHERE username=?";
            PreparedStatement checkStmt = conn.prepareStatement(checkSql);
            checkStmt.setString(1, username);
            ResultSet rs = checkStmt.executeQuery();

            if (rs.next() && rs.getInt(1) > 0) {
                JOptionPane.showMessageDialog(this,
                        "Username already exists! Please choose another.",
                        "Username Taken",
                        JOptionPane.WARNING_MESSAGE);
                return;
            }

            String sql = "INSERT INTO userdata(username,password,email) VALUES (?,?,?)";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, username);
            stmt.setString(2, password);
            stmt.setString(3, email);

            int result = stmt.executeUpdate();

            if (result > 0) {
                JOptionPane.showMessageDialog(this,
                        "Registration successful!\nYou can now login with your credentials.",
                        "Success",
                        JOptionPane.INFORMATION_MESSAGE);
                backToLogin();
            }

        } catch (SQLException ex) {
            if (ex.getMessage().contains("Duplicate entry")) {
                JOptionPane.showMessageDialog(this,
                        "Username or email already exists!",
                        "Registration Error",
                        JOptionPane.ERROR_MESSAGE);
            } else {
                JOptionPane.showMessageDialog(this,
                        "Database Error: " + ex.getMessage(),
                        "Error",
                        JOptionPane.ERROR_MESSAGE);
            }
            ex.printStackTrace();
        }
    }

    private boolean isValidEmail(String email) {
        return email.contains("@") && email.contains(".");
    }
}

class DBConnect {

    private static final String DB_URL = "jdbc:mysql://localhost:3306/project_testing";
    private static final String DB_USER = "root";
    private static final String DB_PASS = "";
    private static final String DRIVER_CLASS = "com.mysql.cj.jdbc.Driver";

    static {
        try {
            Class.forName(DRIVER_CLASS);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    public static Connection connect() throws SQLException {
        try {
            Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
            return conn;
        } catch (SQLException e) {
            e.printStackTrace();
            throw e;
        }
    }
}