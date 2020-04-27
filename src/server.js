require('dotenv').config({ path: 'variables.env' }); // configuration file

const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require('sqlite3').verbose();
const json2html = require('json2html'); // turn JSON into beautiful HTML table
const fs = require('fs');

const goto = require('./goto');

//--------------------------------------------------
// initialize logger 

const appdata = process.env.appdata; // store logs in the %APPDATA% folder
const loggerDir = appdata + '\\facebook_bot\\';
if(!fs.existsSync(loggerDir)){
    fs.mkdirSync(loggerDir);
}
const logFile = loggerDir + '\\log.txt';
const debugFile = loggerDir + '\\debug.txt';
const errorFile = loggerDir + '\\errors.txt';

const loggerSettings = {
    logFile: logFile,
    debugFile: debugFile,
    errorFile: errorFile
}

const { initLogger, Logger } = require('./logger');
const logger = initLogger(loggerSettings);

//------------------------------------------------------

// helper function to trim strings
if (typeof (String.prototype.trim) === "undefined") {
    String.prototype.trim = function () {
      return String(this).replace(/^\s+|\s+$/g, '');
    };
}

const dbm = require('./database-manager').instance(); // create an instance of our database manager
dbm.setup_connection( goto('db/cmps.db')); // setup its connection once

const setupGetStartedButton = require("./setup-button");

const getstarted = require('./get-started');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


const verifyWebhook = require('./verify-webhook');

const messageWebhook = require('./message-webhook');

app.post('/', messageWebhook);

app.get('/', verifyWebhook);

app.get('/test', (req, res) => {
    res.send("The server is running fine");
})

// basic view over some entities in our database
app.get('/view/:query', (req, res) => {

    switch(req.params.query){
        case 'courses':
            dbm.renderedQuery( dbm.queries.get_courses() , (table) => {
                res.send(table);
            });
            break
        case 'lectures':
            // delete fbclid because we don't care about it for now
            delete req.query.fbclid;

            if (!!req.query.building){
                var building = req.query.building;
                building = building.toUpperCase();

                dbm.renderedQuery( dbm.queries.get_lectures_in(building), (table) => {
                    res.send(table);
                });
            }else if (!!req.query.days) {

                var days = req.query.days;
                days = days.toUpperCase();

                dbm.renderedQuery( dbm.queries.get_lectures_at(days), (table) => {
                    res.send(table);
                });

                
            }else{
                dbm.renderedQuery( dbm.queries.get_lectures(), (table) => {
                    res.send(table);
                });
            }
            break;
        case 'rooms':
            dbm.renderedQuery( dbm.queries.get_rooms(), (table) => {
                res.send(table);
            });
            break;
        default:
            res.send("invalid query requested!");
    }

});

app.get('/setup', (req, res) => {
    setupGetStartedButton(res);
})

// first one for real server port , second in the package config variable and last is our default
var current_port = process.env.PORT || process.env.npm_package_config_port || 3000;

app.listen( current_port , () =>  {

    logger.log(`"CMPS Department Bot" server is listening on port: ${current_port} `, Logger.severity.info);

});