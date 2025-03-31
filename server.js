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
                    case 4: //Nurse
                        return res.sendFile(path.join(publicPath, 'html', 'nurse_home.html'));
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
app.get('/nurse',(req,res) => {
    res.sendFile(path.join(publicPath, 'html', 'nurse_home.html'));
});

// Serve invalid-info page if login fails
app.get('/invalid-info', (req, res) => {
    res.sendFile(path.join(publicPath, 'html', 'invalid-info.html')); // Serve the invalid-info page
});

/* 
1. Get Patients Assigned to a Nurse (Updated with MedicalRecords and name fields):
   This route will retrieve the list of patients assigned to a specific nurse using the nurse's ID.
*/

app.get('/get_patients', (req, res) => {
    const nurseID = req.session.nurseID;

    if (!nurseID) {
        return res.status(401).json({ error: "Unauthorized - Nurse not logged in" });
    }

    const query = `
        SELECT users.UserID, users.FirstName, users.LastName
        FROM users
        JOIN medicalrecords ON medicalrecords.PatientID = users.UserID
        WHERE medicalrecords.NurseID = ?;
    `;

    connection.query(query, [nurseID], (err, results) => {
        if (err) {
            console.error("Error fetching patients:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results); // Send patients as JSON
    });
});

/* 
2. Submit Pre-Screening Data:
   This route allows a nurse to submit pre-screening data for a patient.
*/

app.post("/submit_prescreening", (req, res) => {
    // Extract patient data from request body
    const { patientID, doctorID, temperature, bloodPressure, height, weight, symptoms, prescriptionID } = req.body;
    
    const nurseID = req.session.nurseID; 

    if (!nurseID) {
        return res.status(401).json({ error: "Unauthorized - Nurse not logged in" });
    }

    const sql = `
        INSERT INTO PreScreeningData (PatientID, NurseID, DoctorID, Temperature, BloodPressure, Height, Weight, Symptoms, prescriptionID)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    connection.query(sql, [patientID, nurseID, doctorID, temperature, bloodPressure, height, weight, symptoms, prescriptionID], (err, result) => {
        if (err) {
            console.error("Database insert error:", err);
            return res.status(500).json({ error: "Database insert error" });
        }
        res.json({ message: "Pre-screening data saved successfully!" });
    });
});


// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
