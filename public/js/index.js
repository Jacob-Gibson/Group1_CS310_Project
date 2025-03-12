const mysql = require('mysql2');

// Create connection to MySQL
const connection = mysql.createConnection({
    host: '127.0.0.1', // or 'localhost'
    user: 'root',
    password: '', // If you didn’t set a password, leave it empty: ''
    database: 'PatientSystem',
    port: 3306  // Change to 3307 if using XAMPP and MySQL runs on a different port
});

// Connect to MySQL
connection.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
        return;
    }
    console.log('Connected to MySQL database!');
});

// Sample Query to fetch Users
connection.query('SELECT * FROM Appointments', (err, results) => {
    if (err) {
        console.error('Query error:', err.message);
    } else {
        console.log('Appointments:', results);
    }

    connection.end(); // Close the connection
});
