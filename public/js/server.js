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

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Redirect root ("/") to the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'html', 'login.html'));
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

                // Redirect based on the user's RoleID and serve HTML from public/html
                switch (roleID) {
                    case 1: // Patient
                        return res.sendFile(path.join(__dirname, 'public', 'html', 'patientHomepageExample.html'));
                    case 2: // Doctor
                        return res.sendFile(path.join(__dirname, 'public', 'html', 'docHomepageExample.html'));
                    case 3: // Admin
                        return res.sendFile(path.join(__dirname, 'public', 'html', 'adminPageExample.html'));
                    default:
                        return res.sendFile(path.join(__dirname, 'public', 'html', 'landingPage.html')); // Default landing page
                }
            } else {
                // If login fails, redirect to invalid-info page
                return res.sendFile(path.join(__dirname, 'public', 'html', 'invalid-info.html'));  // Serve the invalid-info page
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
