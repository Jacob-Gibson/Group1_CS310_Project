const express = require('express');
const mysql = require('mysql2');
const http = require('http');
const socketio = require('socket.io');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session'); // Add express-session
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const port = 3000;

// Create MySQL connection
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'patientsystem',
    port: 3306
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

// Use session middleware
app.use(session({
    secret: 'yourSecretKey', // Use a secret key for session
    resave: false,
    saveUninitialized: true
}));

// Serve static files from the "public" directory
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));


// Routes for serving HTML pages
app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'html', 'index.html')));
app.get('/doctorPrescriptions', (req, res) => res.sendFile(path.join(publicPath, 'html', 'doctorPrescriptions.html')));

// Handle login form submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = `
        SELECT * FROM Users WHERE Username = ? AND UserPassword = ?;
    `;
    connection.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Query error:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length > 0) {
            const user = results[0];
            const roleID = user.RoleID;

            // Save user info in session
            req.session.userID = user.UserID;
            req.session.roleID = roleID;

            // Role-based redirection
            switch (roleID) {
                case 1: // Patient
                    return res.redirect('/patient');
                case 2: // Doctor
                    return res.redirect('/docHomepage');
                case 3: // Admin
                    return res.redirect('/admin');
                case 4: // Nurse
                    return res.redirect('/nurse');
                default:
                    return res.redirect('/invalid-info');
            }
        } else {
            // Login failed, redirect to error page
            return res.redirect('/invalid-info');
        }
    });
});

app.get('/getCurrentUser', (req, res) => {
    if (req.session.userID && req.session.roleID) {
        res.json({ userID: req.session.userID, roleID: req.session.roleID });
    } else {
        res.status(401).json({ message: "User not logged in" });
    }
});



// Logout route
app.post('/logout', (req, res) => {
    // Destroy the session to log the user out
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to log out');
        }

        // Redirect to login page after successful logout
        res.redirect('/');
    });
});

// Serve the Invalid Info Page
app.get('/invalid-info', (req, res) => {
    res.sendFile(path.join(publicPath, 'html', 'invalid-info.html'));
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
app.get('/nurse', (req, res) => {
    res.sendFile(path.join(publicPath, 'html', 'nurse_home.html'));
});

// Endpoint to get all users (excluding the current user)
app.get('/users', (req, res) => {
    const currentUserID = req.session.userID;
    const query = `SELECT UserID, FirstName, LastName FROM Users WHERE UserID != ?;`;
    connection.query(query, [currentUserID], (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.json(results);
    });
});


// Endpoint to fetch messages between two users
app.get('/messages', (req, res) => {
    const { userID, otherID } = req.query;
    const query = `
        SELECT SenderID, MessageText, Timestamp
        FROM Messages
        WHERE (SenderID = ? AND ReceiverID = ?) OR (SenderID = ? AND ReceiverID = ?)
        ORDER BY Timestamp;
    `;
    connection.query(query, [userID, otherID, otherID, userID], (err, results) => {
        if (err) {
            console.error('Error fetching messages:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.json(results);
    });
});


// Fetch pre-screening data for a specific patient
app.get('/getPreScreening', (req, res) => {
    const { patientID } = req.query;

    const query = `
        SELECT
            ps.PreScreenID,
            ps.PatientID,
            ps.NurseID,
            ps.DoctorID,
            ps.Temperature,
            ps.BloodPressure,
            ps.Height,
            ps.Weight,
            ps.Symptoms,
            ps.Prescriptions,
            ps.CreatedAt,
            u.FirstName AS NurseFirstName,
            u.LastName AS NurseLastName
        FROM prescreeningdata ps
                 JOIN users u ON ps.NurseID = u.UserID
        WHERE ps.PatientID = ?;
    `;

    connection.query(query, [patientID], (err, results) => {
        if (err) {
            console.error('Error fetching pre-screening data:', err);
            return res.status(500).send('Internal Server Error');
        }

        res.json(results); // Send the fetched data as JSON
    });
});

// Update prescreening data
app.put('/updatePreScreening/:id', (req, res) => {
    const preScreenID = req.params.id;
    const { Temperature, BloodPressure, Height, Weight, Symptoms, Prescriptions } = req.body;

    const query = `UPDATE prescreeningdata SET 
                    Temperature = ?, 
                    BloodPressure = ?, 
                    Height = ?, 
                    Weight = ?, 
                    Symptoms = ?, 
                    Prescriptions = ?
                    WHERE PreScreenID = ?`;

    connection.query(query, [Temperature, BloodPressure, Height, Weight, Symptoms, Prescriptions, preScreenID], (err, results) => {
        if (err) {
            console.error('Error updating prescreening data:', err);
            return res.status(500).send('Internal Server Error');
        }

        res.send('Prescreening data updated successfully.');
    });
});

// Delete prescreening data
app.delete('/deletePreScreening/:id', (req, res) => {
    const preScreenID = req.params.id;

    const query = `DELETE FROM prescreeningdata WHERE PreScreenID = ?`;

    connection.query(query, [preScreenID], (err, results) => {
        if (err) {
            console.error('Error deleting prescreening data:', err);
            return res.status(500).send('Internal Server Error');
        }

        res.send('Prescreening data deleted successfully.');
    });
});

// Fetch patients assigned to the logged-in nurse
app.get('/getPatientsForNurse', (req, res) => {
    const nurseID = req.session.userID; // Nurse ID from session

    const query = `
        SELECT
            u.UserID AS PatientID,
            u.FirstName,
            u.LastName
        FROM users u
        JOIN appointments a ON u.UserID = a.PatientID
        WHERE a.NurseID = ?;
    `;

    connection.query(query, [nurseID], (err, results) => {
        if (err) {
            console.error('Error fetching patients:', err);
            return res.status(500).send('Internal Server Error');
        }

        res.json(results); // Send the patients as JSON
    });
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
// Real-time messaging with private rooms
io.on('connection', (socket) => {
    console.log('New client connected');

    // Join the user's personal room on connection
    socket.on('joinRoom', (userID) => {
        socket.join(`user-${userID}`);
        console.log(`User ${userID} joined their personal room`);
    });

    // Handle sending a private message
    socket.on('sendMessage', (messageData) => {
        const { senderID, receiverID, messageText } = messageData;

        // Save message to the database
        const query = `
            INSERT INTO Messages (SenderID, ReceiverID, MessageText, Timestamp)
            VALUES (?, ?, ?, NOW());
        `;
        connection.query(query, [senderID, receiverID, messageText], (err) => {
            if (err) console.error('Error saving message:', err);

            // Emit the message to the specific room for private messaging
            const roomID = `user-${receiverID}`;
            io.to(roomID).emit('receiveMessage', messageData);
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});


// Add Medical Record (Restricted to Doctors, Nurses, and Admins)
app.post('/addRecord', (req, res) => {
    const { roleID, userID } = req.session;

    // Only allow doctors (2), nurses (4), and admins (3) to add records
    if (![2, 3, 4].includes(roleID)) {
        return res.status(403).json({ message: "Unauthorized to add medical records" });
    }

    const { patientID, diagnosis, prescription, notes } = req.body;

    if (!patientID || !diagnosis || !prescription || !notes) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const query = `
        INSERT INTO MedicalRecords (PatientID, DoctorID, Diagnosis, Prescription, Notes)
        VALUES (?, ?, ?, ?, ?);
    `;
    connection.query(query, [patientID, userID, diagnosis, prescription, notes], (err) => {
        if (err) {
            console.error('Error adding medical record:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.json({ message: "Medical record added successfully!" });
    });
});



// View Medical Records (Restricted by Role)
app.get('/getRecords', (req, res) => {
    const { roleID, userID } = req.session;
    const patientID = req.query.patientID || userID;

    let query;
    let params;

    if (roleID === 1) { // Patient can view only their own records
        query = `
            SELECT mr.RecordID, u.FirstName, u.LastName, mr.DoctorID, mr.Diagnosis, mr.Prescription, mr.Notes
            FROM MedicalRecords mr
                     JOIN Users u ON mr.PatientID = u.UserID
            WHERE mr.PatientID = ?;
        `;
        params = [userID];
    } else if ([2, 3, 4].includes(roleID)) { // Doctor, Nurse, Admin
        query = `
            SELECT mr.RecordID, u.FirstName, u.LastName, mr.DoctorID, mr.Diagnosis, mr.Prescription, mr.Notes
            FROM MedicalRecords mr
                     JOIN Users u ON mr.PatientID = u.UserID
            WHERE mr.PatientID = ?;
        `;
        params = [patientID];
    } else {
        return res.status(403).send('Unauthorized access');
    }

    connection.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching records:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.json(results);
    });
});



// Delete Medical Record (Admin Only)
app.delete('/deleteRecord/:id', (req, res) => {
    if (req.session.roleID !== 3) {
        return res.status(403).send('Unauthorized access');
    }
    const recordID = req.params.id;

    const query = `DELETE FROM MedicalRecords WHERE RecordID = ?`;
    connection.query(query, [recordID], (err, result) => {
        if (err) {
            console.error('Error deleting record:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.json({ message: "Medical record deleted successfully!" });
    });
});




// Endpoint to update an existing medical record
app.put('/editRecord/:id', (req, res) => {
    const recordID = req.params.id;
    const { patientID, doctorID, diagnosis, prescription, notes } = req.body;

    const query = `
        UPDATE MedicalRecords
        SET PatientID = ?, DoctorID = ?, Diagnosis = ?, Prescription = ?, Notes = ?
        WHERE RecordID = ?;
    `;
    connection.query(query, [patientID, doctorID, diagnosis, prescription, notes, recordID], (err) => {
        if (err) {
            console.error('Error updating record:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.send('Record updated successfully');
    });
});



// Get all patients
app.get('/patients', (req, res) => {
    const query = 'SELECT UserID, FirstName, LastName FROM Users WHERE RoleID = 1';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching patients:', err);
            res.status(500).json({ error: 'Failed to fetch patients' });
        } else {
            res.json(results);
        }
    });
});


// Start the server
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
