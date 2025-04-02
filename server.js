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

    // Query the database to get all users except the current logged-in user
    const query = `
        SELECT UserID, FirstName, LastName FROM Users WHERE UserID != ?;
    `;
    connection.query(query, [currentUserID], (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).send('Internal Server Error');
        }

        res.json(results); // Send the users as a JSON response
    });
});

// Endpoint to fetch messages between two users
app.get('/messages', (req, res) => {
    const { userID, otherID } = req.query;

    // Query to get messages between the two users
    const query = `
        SELECT * FROM Messages
        WHERE (SenderID = ? AND ReceiverID = ?) OR (SenderID = ? AND ReceiverID = ?)
        ORDER BY Timestamp;
    `;
    connection.query(query, [userID, otherID, otherID, userID], (err, results) => {
        if (err) {
            console.error('Error fetching messages:', err);
            return res.status(500).send('Internal Server Error');
        }

        res.json(results); // Send the messages as a JSON response
    });
});

// Socket.io - Real-time messaging with private rooms
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
            INSERT INTO Messages (SenderID, ReceiverID, MessageText)
            VALUES (?, ?, ?);
        `;
        connection.query(query, [senderID, receiverID, messageText], (err) => {
            if (err) console.error('Error saving message:', err);

            // Emit the message only to the specific room
            const roomID = `room-${Math.min(senderID, receiverID)}-${Math.max(senderID, receiverID)}`;
            io.to(roomID).emit('receiveMessage', messageData);
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
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

// Start the server
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
