/*
The database manager is a singleton class that is created to manage the SQLite queries 
required by the server. 
The manager can add data into the database, change values and ofcourse return queries
to users.
the database manager handles common queries used by the facebook chat bot and format them
*/
const sqlite3 = require("sqlite3");
const json2html = require('json2html'); // turn JSON into beautiful HTML table
const path = require('path');
const fs = require('fs');
const createQueryIterator = require('./query-iterator').createQueryIterator; // import query iterator


class DatabaseManager {

    constructor() {

        if(!!DatabaseManager.instance){
            return DatabaseManager.instance;
        }

        DatabaseManager.instance = this;

        return this;
    }

    // store frequently used queries
    queries = {
        get_courses : () => { return "SELECT * FROM course"; },
        get_lectures : () => { return "SELECT * FROM lecture"; },
        get_rooms : () => { return "SELECT * FROM room";},
        get_lectures_in: (bldgname) => { return `SELECT * FROM lecture WHERE bldgname = '${bldgname}';`; },
        get_lectures_at: (days) => { return `SELECT * FROM lecture WHERE lec_days = '${days}';`},
        get_users : () => { return "SELECT * FROM client;"},
        add_user : (userId) => { return `INSERT INTO client VALUES (${userId});`}
    }

    // store frequently used queries results
    table = {}

    // save current program provided
    latest_program = { semester: "spring", year: 2020}

    // ongoing queries are partitioned queries that the users are still using or displaying

    ongoing = {}
    

}

// select a database to connect to
DatabaseManager.prototype.setup_connection = function (database_path) {
    DatabaseManager.prototype.database = database_path;
}


// return an open connection to the database; need to close manually
DatabaseManager.prototype.connect = function () {
    return new sqlite3.Database( this.database , sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
        console.error(err.message);
        }
    });
}

// this function reads queries from a sql file and executes them
//note: don't use this for now as the sqlite3 module uses asynchronous methods
DatabaseManager.prototype.runSQLfile = function(file_path) {


    var db = this.connect();

    var data = fs.readFileSync( file_path , 'utf-8');

    var queries = data.split( new RegExp(';', 'm') );

    for (var i = 0; i <  queries.length; i++){

        if(queries[i] == ''){
            continue;
        }

        db.run(queries[i], [] , (err) => {
            if (err) {
              console.log('ERROR!', err);
            }
          });

          
    }

    db.close();

}

// connnect to the database and return query results and then close the connection
DatabaseManager.prototype.executeQuery = function (query, successFunc ) {

    var db = this.connect();

    db.all( query , [], (err, rows)=>{

        if(err){
            throw err;
        }

        db.close();

        successFunc(rows);
    })
}

// does exactly like executeQuery but return results as rendered HTML content
DatabaseManager.prototype.renderedQuery = function (query, successFunc) {

    this.executeQuery(query, (res) => {
        let results = res;
        successFunc( json2html.render( {results} ));
    });
}


// store most frequently used queries results
DatabaseManager.prototype.storeQuery = function (query, name, successFunc){

    this.executeQuery(query, (res) => {

        this.table[name] = res;

        if(!!successFunc){
            successFunc(res);
        }

        console.log(`[${name}] : query stored`);
    })
}


//---------------------------------------------------------------------------------


// DATABASE DATA MANAGER

// example API usage:
//
// FOR STORED QUERIES:
//
// dbm.requestStoredQuery(userId, 'rooms', dbm.formatRooms); // request access to a saved query and its chosen formatter
// var request = dbm.getRequest(userId); // get the request for the user with page, last (page), nextPage, and formatter
// var data = request.nextPage(); // try to retreive next page
// if(!!data){ // only evaluate statement if data exists!
//   return sendTextMessage(userId, request.formatter(data, request.page(), request.last())); // format the data by formatter and page nums
// }
//
// FOR CUSTOM QUERIES:
// dbm.executeQuery(dbm.queries.get_lectures_in(lib[1].toUpperCase()), (res) => { // execute query and then request to store that query
//     dbm.requestCustomQuery(userId, res, dbm.formatLectures);
//     var request = dbm.getRequest(userId);
//     var data = request.nextPage();
//     if (!!data) {
//       return sendTextMessage(userId, request.formatter(data, request.page(), request.last()));
//     }
//   });


// request the database manager to view stored queries from the table
// property and stores it as an ongoing partitioned query
DatabaseManager.prototype.requestStoredQuery= function(userId, table_entry, formatter) { // formatter is the function that formats the data

    this.ongoing[userId] = { data: createQueryIterator(this.table[table_entry], 10), formatter: formatter };
}

// create a custom request on demand
DatabaseManager.prototype.requestCustomQuery = function(userId, query_res, formatter, partition_size = 10){
    this.ongoing[userId] = { data: createQueryIterator(query_res, partition_size), formatter: formatter };
}

// returns the ongoing query that the user is using
// and iterate through its pages with extra information
// NOTE: this function might need a rework and optimization
DatabaseManager.prototype.getRequest = function(userId){

    if(!!this.ongoing[userId]){
        return {
            formatter: this.ongoing[userId].formatter,
            page: this.ongoing[userId].data.getCurrentPage,
            last : this.ongoing[userId].data.getPagesNum,
            nextPage : () => {
                var data = this.ongoing[userId].data.next();

                if(data.done){
                    delete this.ongoing[userId];
                    return false;
                }

                return data.value;
            }
        }
    }

    return undefined;
}


//-------------------------------------------------------------------------
// DATA FORMATTERS
// Code here are intended to format json results of the database
// into readable text after execution

DatabaseManager.prototype.formatCourses = function (crs, pg, mpg) { // courses, page number, max page number

    var result = '';


    for(var i = 0; i < crs.length; i++){

        var course = crs[i];

        result += `${course.subj} ${course.code} - ${course.title}\n\n`;
    }

    result += `\n\n page (${pg}/${mpg})`;

    console.log("courses view executed");

    return result;
}

DatabaseManager.prototype.formatRooms = function (rooms, pg, mpg) {

    var result = '';

    for(var i = 0; i < rooms.length; i++){

        var room = rooms[i];

        result += `Room ${i + 1}: ${room.bldgname} ${room.roomcode}\n\n`;
    }

    result += `\n\n page (${pg}/${mpg})`;

    console.log('rooms view executed');

    return result;
}

DatabaseManager.prototype.formatLectures = function(lectures, pg, mpg){

    var result = '';

    for(var i = 0; i < lectures.length; i++){

        var lecture = lectures[i];

        var subj = (!!lecture.subj ? lecture.subj : '');
        var code = (!!lecture.code ? lecture.code : '');
        var section = (!!lecture.section ? lecture.section : '');
        var semester = (!!lecture.semester ? lecture.semester : '');
        var lec_year = (!!lecture.lec_year ? lecture.lec_year : '');
        var bldgname = (!!lecture.bldgname ? lecture.bldgname : '');
        var roomcode = (!!lecture.roomcode ? lecture.roomcode : '');
        var starting_hour = (!!lecture.starting_hour ? lecture.starting_hour : '');
        var ending_hour = (!!lecture.ending_hour ? lecture.ending_hour : '');
        var lec_days = (!!lecture.lec_days ? lecture.lec_days : '');
        var crn = lecture.crn;

        var days = {'M': 'Monday', 'T': 'Tuesday', 'W': 'Wednesday', 'R': 'Thurday', 'F': 'Friday'};

        if(lec_days != ''){
            lec_days = lec_days.split('');
            lec_days = lec_days.map( day => days[day] );
            lec_days = lec_days.join(' and ');
        }

        // result += `Lecture ${i + 1}:\n\n`;
        result += `${subj} ${code} - ${section}\n${semester} ${lec_year}\n`;
        result += `CRN: ${crn}\n`;
        result += `Taught in ${bldgname} ${roomcode} between ${starting_hour} and ${ending_hour} every ${lec_days}\n\n`;
    }

    result += `\n\n page (${pg}/${mpg})`;

    console.log('lectures view executed');

    return result;   
}


//------------------------------------------------------------------------

// QUERY TABLE FUNCTIONS
// functions related to the stored queries

DatabaseManager.prototype.userFound = function (userId){

    var usersList = this.table.users;

    for(var i = 0; i < usersList.length; i++){
        if(usersList[i].fid == userId){
            return true;
        }
    }

    return false;
}

module.exports = { instance : function() { return new DatabaseManager() } };