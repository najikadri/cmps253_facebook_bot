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
const { createLogger, Logger } = require('./logger');
const logger = createLogger();

 // get the latest program provided
const latest_program = { semester: "Spring", year: 2020};

String.prototype.currentSemester = function(with_where = false){
    return `${this} ${(with_where ? 'WHERE ' : 'AND ')} semester="${latest_program.semester}" AND lec_year=${latest_program.year}`;
}

// ashortcut since it is used very frequently
function currentSemester (){
    return `semester="${latest_program.semester}" AND lec_year=${latest_program.year}`;
}


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
        get_courses_by_attribute: (attr) => { return `SELECT * FROM course WHERE attribute LIKE '${attr}%' COLLATE NOCASE;`},
        get_course_info: (subj, code) => { return `SELECT * FROM course WHERE subj = '${subj}' AND code = '${code}' AND description NOT NULL;`},
        get_title: (subj, code) => { return `SELECT title FROM course WHERE subj='${subj}' and code='${code}'`;},
        get_lectures : () => { return "SELECT * FROM lecture".currentSemester(true); },
        get_rooms : () => { return "SELECT * FROM room";},
        get_lectures_in: (bldgname, subj, code) => { 
            subj = (!!subj ? `'${subj}'` : 'subj');
            code = (!!code ? `'${code}'` : 'code');
            return `SELECT * FROM ( SELECT * FROM lecture WHERE subj = ${subj} AND code = ${code} AND bldgname='${bldgname}' AND ${currentSemester()}) LEFT JOIN (SELECT email, first_name, last_name FROM instructor) ON instructor_email = email;`;
        },
        get_lectures_on: (days, subj, code) => {
            subj = (!!subj ? `'${subj}'` : 'subj');
            code = (!!code ? `'${code}'` : 'code');
            return `SELECT * FROM ( SELECT * FROM lecture WHERE subj = ${subj} AND code = ${code} AND lec_days='${days}' AND ${currentSemester()}) LEFT JOIN (SELECT email, first_name, last_name FROM instructor) ON instructor_email = email;`;
        },
        get_lectures_in_on: (bldgname, days, subj, code) => {
            subj = (!!subj ? `'${subj}'` : 'subj');
            code = (!!code ? `'${code}'` : 'code');
            return `SELECT * FROM ( SELECT * FROM lecture WHERE subj = ${subj} AND code = ${code} AND bldgname='${bldgname}' AND lec_days='${days}' AND ${currentSemester()}) LEFT JOIN (SELECT email, first_name, last_name FROM instructor) ON instructor_email = email;`;
        },
        get_lectures_for: (subj, code) => {
            code = (!!code ? `'${code}'` : 'code');
            return `SELECT * FROM ( SELECT * FROM lecture WHERE subj='${subj}' AND code=${code} AND ${currentSemester()}) LEFT JOIN (SELECT email, first_name, last_name FROM instructor) ON instructor_email = email;`;
        },
        get_users : () => { return "SELECT * FROM client;"},
        add_user : (userId, fn, ln) => { return `INSERT INTO client VALUES (${userId}, ${fn}, ${ln})`},
        get_courses_for: (subj) => {return `SELECT * FROM course WHERE subj="${subj}"`},
        get_instructor_by_firstname: (first_name) => {return `SELECT * FROM instructor WHERE LOWER(first_name) like '%${first_name}%';`},
        get_instructor_by_lastname: (last_name) => {return `SELECT * FROM instructor WHERE LOWER(last_name) like '%${last_name}%';`},
        get_instructor_by_fullname: (fullname) => {return `SELECT * FROM instructor WHERE LOWER(first_name || " " || last_name) = '${fullname}';`},
        submit_issue: (user_id, message) => {return `insert into issue values (${user_id}, ifnull( (select max(msgno) + 1 from issue where fid= ${user_id}),  1), "${message}");`},
        get_tuition: (dep, deglvl) => {
            if(!!deglvl){
                deglvl = `'${deglvl}'`; // surround with string quotation marks
            }else{
                deglvl = 'tuition.degree_level';
            }
            return `SELECT *
            FROM department,
                 tuition
           WHERE department.faculty_name = tuition.faculty_name AND 
                 department.name = '${dep}' COLLATE NOCASE AND 
                 tuition.degree_level = ${deglvl} COLLATE NOCASE AND 
                 tuition.semester = '${latest_program.semester}' AND 
                 tuition.year = ${latest_program.year};
          ;`
        },
        get_info: (tag) => { return `SELECT * FROM info WHERE tag = '${tag}';`},
        get_studyplan( major, deglvl){
            return `SELECT * FROM studyplan WHERE major = '${major}' COLLATE NOCASE AND degree_level = '${deglvl}' COLLATE NOCASE;`
        },
        get_building_image: (bldgname) => { return `SELECT * FROM building WHERE (bldgname = '${bldgname}' COLLATE NOCASE OR alias like '${bldgname}%' COLLATE NOCASE) AND image_url NOT NULL;`},
        get_catalogue: (dep, deglvl) => { return `SELECT * FROM catalogues WHERE department = '${dep}' COLLATE NOCASE AND degree_level = '${deglvl}' COLLATE NOCASE;`},
        get_departments: () => { return 'SELECT * FROM department;'},
        get_buildings: () => { return 'SELECT * FROM building;'}


        
    }

    // store frequently used queries results
    table = {}

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
            logger.log(err.message, Logger.severity.error);
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

        logger.log(`[${name}] : query stored`, Logger.severity.info);
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

function _mapDays(lec_days){

    var days = {'M': 'Monday', 'T': 'Tuesday', 'W': 'Wednesday', 'R': 'Thursday', 'F': 'Friday'};

    if(lec_days != ''){
        lec_days = lec_days.split('');
        lec_days = lec_days.map( day => days[day] );
        lec_days = lec_days.join(' and ');
    }

    return lec_days;
}

function _formatPage (pg, mpg){
    return ( pg > 0 ? `\n\n page (${pg}/${mpg})` : '');
}


function _formatCourses(crs){ // courses, page number, max page number

    var result = '';


    for(var i = 0; i < crs.length; i++){

        var course = crs[i];

        if(!!course.attribute){
            result += `${course.subj} ${course.code} - ${course.title}\nAttribute: ${course.attribute}\n\n`;
        }else{
            result += `${course.subj} ${course.code} - ${course.title}\n\n`;
        }
        
    }


    return result;
}

function _formatRooms(rooms){

    var result = '';

    for(var i = 0; i < rooms.length; i++){

        var room = rooms[i];

        result += `Room ${i + 1}: ${room.bldgname} ${room.roomcode}\n\n`;
    }

    return result;
}

function _formatLectures(lectures){

    var result = '';

    for(var i = 0; i < lectures.length; i++){

        var lecture = lectures[i];

        var subj = (!!lecture.subj ? lecture.subj : '');
        var code = (!!lecture.code ? lecture.code : '');
        var section = (!!lecture.section ? lecture.section : '');
        var credits = lecture.credits;
        var semester = (!!lecture.semester ? lecture.semester : '');
        var lec_year = (!!lecture.lec_year ? lecture.lec_year : '');
        var bldgname = (!!lecture.bldgname ? lecture.bldgname : '');
        var roomcode = (!!lecture.roomcode ? lecture.roomcode : '');
        var starting_hour = (!!lecture.starting_hour ? lecture.starting_hour : '');
        var ending_hour = (!!lecture.ending_hour ? lecture.ending_hour : '');
        var lec_days = (!!lecture.lec_days ? lecture.lec_days : '');
        var crn = lecture.crn;
        var instructor = lecture.instructor_email;

        lec_days = _mapDays(lec_days);

        result += `${subj} ${code} - ${section} (${credits} crs.)\n${semester} ${lec_year}\n`;
        result += `CRN: ${crn}\n`;

        if(bldgname != '' || starting_hour !=  ''){
            result += "Taught";
        }else{
            result += "No further information is available";
        }

        if( bldgname != ''){
            result += ` in ${bldgname} ${roomcode}`;
        }
        
        if( starting_hour != ''){
            result += ` between ${starting_hour} and ${ending_hour} every ${lec_days}`;
        }

        if(!!instructor){
            result += `\nInstructor: ${_formatInstructor(lecture)}`; // instructor information can be extracted from the lecture object
        }

        result += '\n\n';
    }

    return result;   
}


function _formatInstructor (instr){
    return `${instr.first_name} ${instr.last_name} (${instr.email})`;
}

function _formatTitle (subj, code, res){
    return `${subj} ${code} : ${res[0].title}`;
}

function _formatInstructors(instrs){

    var result = '';

    for(var i = 0; i  < instrs.length; i++){
        var instr = instrs[i];

        var name = instr.first_name + ' ' + instr.last_name;
        var email = instr.email;
        var department = (!!instr.department ? instr.department : undefined);
        var office_days = (!!instr.office_days ? _mapDays(instr.office_days) : undefined);
        var building = (!!instr.bldgname ? instr.bldgname : undefined);
        var room = (!!instr.roomcode ? instr.roomcode : undefined);
        var office_starting_hour = (!!instr.office_starting_hour ? instr.office_starting_hour : undefined);
        var office_ending_hour = (!!instr.office_ending_hour ? instr.office_ending_hour : undefined);

        result += `Instructor: ${name} (${email})\n`;

        if(!!department){
            result += `Department: ${department}\n`;
        }

        if(!!building || !!office_days || !!office_starting_hour){
            result += `Office Hours:`;
        }
        

        if(!!building){
            result += ` ${building} ${room}`;
        }

        if(!!office_days){
            result += ` every ${office_days}`;
        }

        if(!!office_starting_hour){
            result += ` between ${office_starting_hour} and ${office_ending_hour}`;
        }

        result += '\n\n';

    }



    return result;

}

function _formatTuition (tuitions) {
    var text = '';
    for (var i = 0; i < tuitions.length; i++){
        var tuition = tuitions[i];
        text += `Credit cost for ${tuition.name} ( ${tuition.degree_level} ) in ${tuition.faculty_name} is $${tuition.credit_cost}\n`;
    }
    return text;
}


function _formatDepartments (departments){

    var result = '';

    for (var i = 0; i < departments.length;i++){
        var dep = departments[i];
        result += `${dep.name} - ${dep.faculty_name}\n\n`;
    }

    return result;
}

function _formatBuildings (buildings){

    var result = '';

    for (var i = 0; i < buildings.length;i++){
        var building = buildings[i];

        if (!!building.alias){
            building.alias = '(' + building.alias + ')';
            result += `${building.bldgname} ${building.alias}\n\n`;
        }else{
            result += `${building.bldgname}\n\n`;
        }

    }

    return result;
}

// DATABASE MANAGER FORMATTER FUNCTIONS WRAPPER

DatabaseManager.prototype.formatCourses = function (crs, pg = -1, mpg = -1) {
    return _formatCourses(crs) + _formatPage(pg, mpg);
}

DatabaseManager.prototype.formatRooms = function (rooms, pg = -1, mpg = -1)  {
    return _formatRooms(rooms, pg, mpg) + _formatPage(pg, mpg);
}

DatabaseManager.prototype.formatLectures = function(lectures, pg = -1, mpg = -1){
    return _formatLectures(lectures) + _formatPage(pg, mpg);
}

DatabaseManager.prototype.formatTitle = function(subj, code, title){
    return _formatTitle(subj, code, title);
}

DatabaseManager.prototype.formatInstructors = function (instructors, pg = -1, mpg = -1){
    return _formatInstructors(instructors) + _formatPage(pg, mpg);
}

DatabaseManager.prototype.formatTuition = function(tuitions){
    return _formatTuition(tuitions);
}

DatabaseManager.prototype.formatDepartments = function(departments, pg = -1, mpg = -1){
    return _formatDepartments(departments) + _formatPage(pg, mpg);
}

DatabaseManager.prototype.formatBuildings = function(buildings, pg = -1, mpg = -1){
    return _formatBuildings(buildings) + _formatPage(pg, mpg);
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