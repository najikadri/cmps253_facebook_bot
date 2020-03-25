const fetch = require('node-fetch');
const dbm = require('./database-manager').instance(); // create an instance of our database manager
const path = require('path');
const fb_api = require('./fb-api').instance();
const nlp = require('./nlp-manager').instance();
const sendTextMessage = fb_api.sendTextMessage; // a shortcut
const getstarted = require('./get-started');

//---------------------------------------------------
// SETUP & STORE COMMON QUERIES


dbm.storeQuery(dbm.queries.get_courses(), 'courses');
dbm.storeQuery(dbm.queries.get_lectures(), 'lectures');
dbm.storeQuery(dbm.queries.get_rooms(), 'rooms');
dbm.storeQuery(dbm.queries.get_users(), 'users');

// dbm.storeQuery ( dbm.queries.get_rooms_used(), 'rooms_used');

//---------------------------------------------------
// SETUP

// Remember the Page Access Token you got from Facebook earlier?
// Don't forget to add it to your `variables.env` file.
const { FACEBOOK_ACCESS_TOKEN } = process.env;

const ErrorMessage = "Sorry I couldn't find any results for your request. 😕";

// helper function to trim strings
if (typeof (String.prototype.trim) === "undefined") {
  String.prototype.trim = function () {
    return String(this).replace(/^\s+|\s+$/g, '');
  };
}

// a function to handle custom queries requests
const handleRequest = function(userId, res, formatter) {
  dbm.requestCustomQuery(userId, res, formatter);
  var request = dbm.getRequest(userId);
  var data = request.nextPage();
  if(!!data){
    return sendTextMessage(userId, formatter(data, request.page(), request.last()));
  }else{
    return sendTextMessage(userId, ErrorMessage);
  }
}

// this function checks if day is valid
const isValidDay = function(days){
  let valid_days = ['M','T','W','R','F','TR', 'WF', 'MW', 'MWF'];
  if(valid_days.includes(days)){
    return true;
  }else{
    let error_msg = 'available days values are: \n';
    for ( var i = 0; i < valid_days.length; i++){
      error_msg += `"${valid_days[i]}"`;
      if (i < valid_days.length - 1){ error_msg += ', ';};
    }
    return { error_msg };
  }
}


// help message builder

const things_to_do = [
  'ask to see all courses offered by the university',
  'ask for the courses offered for a specific subject (ex. CMPS)',
  'ask for lectures for a certain course',
  'ask for lectures in a specific place and/or day(s)',
  'ask for the title or name of a course you heard of',
  'ask for info about instructors if you know their first and/or last names',
  'ask for the email of an instructor'
]

const printThingsToDo = function () {

  var result = '';

  things_to_do.forEach( (element) => {
    result += `📕 - ${element}\n`;
  })

  return result;
}

const HelpMessage = `Here are some of the things that you could do:\n${printThingsToDo()}`;


//--------------------------------------------------------------------------------
// ACTION RUNNER/MANAGER

// these functions process actions provided by the NLP manager and 
// handles everything related to retreiving data from the database
// and other behaviors
const runAction = function (userId, msg, action_string) {
  action_string = action_string.substring(1);
  action_string = action_string.split('>').map((x) => { return x.trim() });
  let action = action_string[0];
  let parameters = {}

  if (action_string.length > 1) {

    action_string[1].split(',').map((x) => x.trim()).forEach(arg => {
      arg = arg.split(':');
      let name = arg[0];
      let value = arg[1];
      parameters[name] = value;
    });

  }

  console.log(action);
  console.log(parameters);

  switch (action) {
    // gets the next query that was loaded before
    case 'help.core':
      return sendTextMessage(userId, HelpMessage);
      break;
    case 'query.next':
      var request = dbm.getRequest(userId);
      if (!!request) {
        var data = request.nextPage();
        if (!!data) {
          return sendTextMessage(userId, request.formatter(data, request.page(), request.last()));
        }
      }
      return sendTextMessage(userId, 'There is nothing to show for now');
      break;
    case 'courses.core':
      dbm.requestStoredQuery(userId, 'courses', dbm.formatCourses);
      var request = dbm.getRequest(userId);
      var data = request.nextPage();
      if (!!data) {
        return sendTextMessage(userId, request.formatter(data, request.page(), request.last()));
      }
      break;
    case 'courses.subject':
      dbm.executeQuery(dbm.queries.get_courses_for(parameters['subj'].toUpperCase()), (res) => {
        return handleRequest(userId, res, dbm.formatCourses);
      })
      break;
    case 'courses.title':

      var subj = parameters['subj'].toUpperCase();
      var code  = parameters['code'].toUpperCase();

      dbm.executeQuery(dbm.queries.get_title(subj, code), (res => {
        if(res.length > 0){
          return sendTextMessage(userId, dbm.formatTitle(subj, code, res))
        }else{

          return sendTextMessage(userId, ErrorMessage);
        }
      }))
      break;
    case 'lectures.building':
      dbm.executeQuery(dbm.queries.get_lectures_in(parameters['in'].toUpperCase()), (res) => {
       return handleRequest(userId, res, dbm.formatLectures);
      })
      break;
    case 'lectures.days':
      var days = parameters['on'].toUpperCase();
      var validation = isValidDay(days);
      if(validation === true){
        dbm.executeQuery( dbm.queries.get_lectures_on(days), (res) => {
          return handleRequest(userId, res, dbm.formatLectures);
        })
      }else{
        return sendTextMessage(userId, validation.error_msg);
      }
      break;
    case 'lectures.building_and_days':
      var bldg = parameters['in'].toUpperCase();
      var days = parameters['on'].toUpperCase();
      var validation = isValidDay(days);
      if(validation === true){
        dbm.executeQuery( dbm.queries.get_lectures_in_on(bldg, days) , (res) => {
          return handleRequest(userId, res, dbm.formatLectures);
        })
      }else{
        return sendTextMessage(userId, validation.error_msg);
      }
      break;
    case 'lectures.course':
      var subj = parameters['subj'].toUpperCase();
      var code  = parameters['code'].toUpperCase();

      dbm.executeQuery(dbm.queries.get_lectures_for(subj, code), (res) => {
        return handleRequest(userId, res, dbm.formatLectures);
      })
      break;
    case 'instructors.info':
      // parameter could be name or email
      if(!!parameters['name']){

        var name = parameters['name'];

        // try to find or suggest instructors by full name first, then by last name, and finally by first name
        dbm.executeQuery( dbm.queries.get_instructor_by_fullname(name), (res) => {
          if(res.length > 0){
            return handleRequest(userId, res, dbm.formatInstructors);
          }else{
            dbm.executeQuery( dbm.queries.get_instructor_by_lastname(name), (res) => {
              if(res.length > 0){
                return handleRequest(userId, res, dbm.formatInstructors);
              }else{
                dbm.executeQuery( dbm.queries.get_instructor_by_firstname(name), (res) => {
                  return handleRequest(userId, res, dbm.formatInstructors);
                });
              }
            });
          }
        });
      }

      break;
    default: console.log('there must be something wrong!');
  }
}

const isAction = function (response) {
  return response[0] === '#';
}

//--------------------------------------------------------------------------------

// this is the function that recieves and process the message

module.exports = (event) => {

  const userId = event.sender.id;
  const message = event.message.text;

  const msg = message.toLowerCase();

  // let the natural language manager handle the message
  nlp.getResponse(userId, msg, (response) => {

    if (isAction(response)) {
      runAction(userId, msg, response);
    } else {
      return sendTextMessage(userId, response);
    }

  });

}


// My own defined functions and methods for the application

/* var getStarted = function (user_id) {
  return fetch(
    `https://graph.facebook.com/v2.6/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        messaging_type: 'RESPONSE',
        recipient: {
          id: user_id,
        },
        message: {
          text: "Welcome to Connect Four Bot!\nChoose what would you like to do:",
          quick_replies: [
            {
              content_type: "text",
              title: "Play Game",
              payload: "PLAY"
              // image_url :"http://example.com/img/green.png"   // use to add images to quick replies 
            },
            {
              content_type: "text",
              title: "Chit Chat",
              payload: "CHAT"
            }
          ]
        },
      }),
    }
  );
} */