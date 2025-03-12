const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;

// Create MySQL connection
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',  // Adjust if you have a password for MySQL
    database: 'PatientSystem',
    port: 3306
});

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Serve login form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));  // Serve the login page
});

// Handle login form submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Query to check if the username and password match any record in the database
    connection.query(
        'SELECT * FROM Users WHERE Username = ? AND UserPassword = ?',
        [username, password],
        (err, results) => {
            if (err) {
                console.error('Query error:', err);
                return res.send('Error during query');
            }

            // Check if user exists and credentials are correct
            if (results.length > 0) {
                const user = results[0];
                const roleID = user.RoleID;

                // Redirect based on the user's RoleID
                switch (roleID) {
                    case 1: // Patient
                        return res.redirect('/patient');
                    case 2: // Doctor
                        return res.redirect('/docHomepage');
                    case 3: // Admin
                        return res.redirect('/admin');
                    default:
                        return res.redirect('/landing'); // Default landing page for unknown roles
                }
            } else {
                // If login fails, redirect to invalid-info page
                return res.redirect('/invalid-info');
            }
        }
    );
});


// Serve dashboard pages based on role
app.get('/patient', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'patientHomepageExample.html'));
});
app.get('/docHomepage', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'docHomepageExample.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'adminPageExample.html'));
});


// Serve invalid-info page if login fails
app.get('/invalid-info', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'invalid-info.html'));  // Serve the invalid-info page
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
