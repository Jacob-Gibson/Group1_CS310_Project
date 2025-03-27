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
    password: '',
    database: 'PatientSystem',
    port: 3306
});

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the "public" directory
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Redirect root ("/") to the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'html', 'index.html'));
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
                        return res.sendFile(path.join(publicPath, 'html', 'patientHomepageExample.html'));
                    case 2: // Doctor
                        return res.sendFile(path.join(publicPath, 'html', 'docHomepageExample.html'));
                    case 3: // Admin
                        return res.sendFile(path.join(publicPath, 'html', 'adminPageExample.html'));
                    default:
                        return res.sendFile(path.join(publicPath, 'html', 'landingPage.html')); // Default landing page
                }
            } else {
                // If login fails, redirect to invalid-info page
                return res.sendFile(path.join(publicPath, 'html', 'invalid-info.html')); // Serve the invalid-info page
            }
        }
    );
});

// Serve dashboard pages based on role
app.get('/patient', (req, res) => {
    res.sendFile(path.join(publicPath, 'html', 'patientHomepageExample.html'));
});
app.get('/docHomepage', (req, res) => {
    res.sendFile(path.join(publicPath, 'html', 'docHomepageExample.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(publicPath, 'html', 'adminPageExample.html'));
});

// Serve invalid-info page if login fails
app.get('/invalid-info', (req, res) => {
    res.sendFile(path.join(publicPath, 'html', 'invalid-info.html')); // Serve the invalid-info page
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
