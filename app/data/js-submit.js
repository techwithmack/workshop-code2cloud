const express = require('express');
const { exec } = require('child_process');
const mysql = require('mysql');

const app = express();

// VULNERABILITY 1: Hardcoded Secrets
// Scanners love finding high-entropy strings assigned to variables like "secret" or "password"
const AWS_SECRET_KEY = "AKIAIOSFODNN7EXAMPLE";
const dbPassword = "super_secret_admin_password_123";

// VULNERABILITY 2: SQL Injection
// Concatenating raw user input directly into a database query
app.get('/user', (req, res) => {
    const userId = req.query.id;
    const query = "SELECT * FROM users WHERE id = " + userId; 
    
    // Fake DB connection for demonstration
    const connection = mysql.createConnection({ user: 'admin', password: dbPassword });
    connection.query(query, (error, results) => {
        res.send(results);
    });
});

// VULNERABILITY 3: Command Injection
// Passing unsanitized user input directly to the underlying operating system
app.get('/ping', (req, res) => {
    const ip = req.query.ip;
    exec(`ping -c 4 ${ip}`, (error, stdout, stderr) => {
        res.send(stdout);
    });
});

// VULNERABILITY 4: Unsafe Eval / Arbitrary Code Execution
// Executing user-provided strings as live code
app.get('/calculate', (req, res) => {
    const mathFormula = req.query.formula;
    const result = eval(mathFormula);
    res.send(`Result: ${result}`);
});

app.listen(3000, () => console.log('Server running... and it is very vulnerable!'));
