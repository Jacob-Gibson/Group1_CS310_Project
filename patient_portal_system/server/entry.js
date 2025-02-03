/* 
    This is the entry point for the program, currently not much here
    If you want a reference for how this project should be structured check this github repo:
    https://github.com/Parikshit-Hooda/loginapp-gfg/tree/master
*/
var express         = require('express'); // using express
var favicon         = require('serve-favicon'); // the icon in the browser tab
var path            = require('path'); // utilities for working with file and directory paths
var cookieParser    = require('cookie-parser'); // to remember user info between sessions
var bodyParser      = require('body-parser'); // for handling HTTP POST requests
var mysql           = require('mysql'); // for the mysql database
var connection      = mysql.createConnection({ // TODO: make the database; THIS IS JUST EXAMPLE INFO
    host    : 'localhost', // for now we are using localhost, prob won't change
    user    : 'test_user', // the username for the mysql db
    password: 'password123', // the password for the mysql db
    database: 'patient_portal_db' // the database we are using at the host
});
var exprValidator   = require('express-validator'); // mainly for validating and sanitizing requests
var passport        = require('passport'); // a middleware for authentication
var localStrat      = require('passport-local').Strategy; // meant for authenticating with user + pass
var logger          = require('morgan'); // a middleware for logging HTTP requests

const app = express();
const PORT = 8080; 

app.get('/', (req,res) => {
    res.send('Test');
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});


