const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();
const port = 3000;

// Create MySQL connection
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: "",
    database: 'patientsystem',
    port: 3307
});

// Connect to MySQL
connection.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session management for user authentication
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Serve static files from the "public" directory
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Routes for serving HTML pages
app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'html', 'index.html')));
app.get('/doctorPrescriptions', (req, res) => res.sendFile(path.join(publicPath, 'html', 'doctorPrescriptions.html')));
app.get('/patientPrescriptions', (req, res) => res.sendFile(path.join(publicPath, 'html', 'patientPrescriptions.html')));

// Handle login form submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    connection.query(
        'SELECT * FROM Users WHERE Username = ? AND UserPassword = ?',
        [username, password],
        (err, results) => {
            if (err) {
                console.error('Query error:', err);
                return res.send('Error during query');
            }

            if (results.length > 0) {
                const user = results[0];
                req.session.userId = user.UserID;
                req.session.roleID = user.RoleID;

                switch (user.RoleID) {
                    case 1:
                        return res.sendFile(path.join(publicPath, 'html', 'patientHomepageExample.html'));
                    case 2:
                        return res.sendFile(path.join(publicPath, 'html', 'docHomepageExample.html'));
                    case 3:
                        return res.sendFile(path.join(publicPath, 'html', 'adminPageExample.html'));
                    default:
                        return res.sendFile(path.join(publicPath, 'html', 'landingPage.html'));
                }
            } else {
                return res.sendFile(path.join(publicPath, 'html', 'invalid-info.html'));
            }
        }
    );
});

// Routes for prescription handling
app.post('/add-prescription', (req, res) => {
    const { patientID, doctorID, medication, dosage, frequency, datePrescribed } = req.body;

    if (!patientID || !doctorID || !medication || !dosage || !frequency || !datePrescribed) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    const query = `
        INSERT INTO prescriptions (PatientID, DoctorID, Medication, Dosage, Frequency, DatePrescribed) 
        VALUES (?, ?, ?, ?, ?, ?)`;

    connection.query(query, [patientID, doctorID, medication, dosage, frequency, datePrescribed], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: "Error saving prescription." });
        }
        res.json({ message: "Prescription added successfully!" });
    });
});

// Get prescriptions for a logged-in patient
app.get('/get-prescriptions', (req, res) => {
    if (!req.session.userId) {
        return res.status(403).json({ message: "Unauthorized. Please log in." });
    }

    const query = "SELECT * FROM prescriptions WHERE PatientID = ?";
    connection.query(query, [req.session.userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json([]);
        }
        res.json(results);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
