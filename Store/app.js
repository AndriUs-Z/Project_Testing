const API_URL = "http://localhost:3000";

function showRegister() {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("registerForm").classList.remove("hidden");
}

function showLogin() {
    document.getElementById("registerForm").classList.add("hidden");
    document.getElementById("loginForm").classList.remove("hidden");
}

// Login
async function login() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    const errorDiv = document.getElementById("error");

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass })
        });

        const data = await res.json();
        if (res.ok) {
            alert(data.message);
            errorDiv.textContent = "";
        } else {
            errorDiv.textContent = data.message;
        }
    } catch (err) {
        errorDiv.textContent = "Server Error: " + err.message;
    }
}

// Register
async function register() {
    const email = document.getElementById("regEmail").value;
    const user = document.getElementById("regUser").value;
    const pass = document.getElementById("regPass").value;

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass, email: email })
        });

        const data = await res.json();
        if (res.ok) {
            alert(data.message);
            showLogin();
        } else {
            alert("Register Failed: " + data.message);
        }
    } catch (err) {
        alert("Server Error: " + err.message);
    }
}
