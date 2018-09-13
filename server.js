var express = require('express'); // ExperssJS Framework
var app = express(); // Invoke express to variable for use in application
var port = process.env.PORT || 8080; // Set default port or assign a port in enviornment
var mongoose = require('mongoose'); // HTTP request logger middleware for Node.js
var bodyParser = require('body-parser'); // Node.js body parsing middleware. Parses incoming request bodies in a middleware before your handlers, available under req.body.
var router = express.Router(); // Invoke the Express Router
var appRoutes = require('./app/routes/api')(router); // Import the application end points/API
var path = require('path'); // Import path module
var passport = require('passport'); // Express-compatible authentication middleware for Node.js.
var social = require('./app/passport/passport')(app, passport); // Import passport.js End Points/API
var axios = require('axios');

app.use(bodyParser.json()); // Body-parser middleware
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(express.static(__dirname + '/public')); // Allow front end to access public folder
app.use('/api', appRoutes); // Assign name to end points (e.g., '/api/management/', '/api/users' ,etc. )

// 
// <---------- REPLACE WITH YOUR MONGOOSE CONFIGURATION ---------->
// 

var connectWithRetry = function(region, projectId) {
    return mongoose.connect('mongodb://root:foobarbaz@db.basic-stack-db-lb.il4.' + region + '.lb.' + projectId + '.internal:27017/mean', function(err) {
        if (err) {
            console.error('Failed to connect to MongoDB on startup: ' + err + '. Retrying in 5 seconds.');
            setTimeout(function() {
                connectWithRetry(region, projectId);
            }, 5000);
        } else {
            console.log("Successfully connected to MongoDB");
        }
    });
};

var metadataClient = axios.create({
    baseURL: 'http://metadata.google.internal/computeMetadata/v1/',
    timeout: 1000,
    headers: {"Metadata-Flavor": "Google"}
});
metadataClient.get("instance/zone").then(function(response) {
    var zoneUrl = response.data;
    var zone = zoneUrl.split("/")[3];
    var zoneParts = zone.split("-");
    var region = zoneParts[0] + '-' + zoneParts[1];
    console.log("Running in GCP region " + region);
    metadataClient.get("project/project-id").then(function(response) {
        var projectId = response.data;
        console.log("Running in GCP project " + projectId);
        connectWithRetry(region, projectId);
    });
});

// Set Application Static Layout
app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/app/views/index.html')); // Set index.html as layout
});

// Start Server
app.listen(port, function() {
    console.log('Running the server on port ' + port); // Listen on configured port
});
