const fetch = require('node-fetch');
const dbm = require('./database-manager').instance(); // create an instance of our database manager
const path = require('path');
const fb_api = require('./fb-api').instance();
const nlp = require('./nlp/nlp-manager').instance();
const { createLogger, Logger } = require('./logger');
const logger = createLogger();
const sc = require('./spell-checker').instance( () => {logger.log('spell checker corpus loaded successfully', Logger.severity.info)} );
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

// this function decides whether to display next button or not with the current query
const displayQuery = function(userId, data, request)
{
  if(request.page() === request.last()){
    return sendTextMessage(userId, request.formatter(data, request.page(), request.last()));
  }else{
    return fb_api.displayQueryMessage(userId, request.formatter(data, request.page(), request.last()));
  }
}

// a function to handle custom queries requests
const handleRequest = function(userId, res, formatter) {
  dbm.requestCustomQuery(userId, res, formatter);
  var request = dbm.getRequest(userId);
  var data = request.nextPage();
  if(!!data){
    displayQuery(userId, data, request);
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
  'report any problem you are facing (e.g. report problem)',
  'ask to see all courses offered by the university (e.g. all courses)',
  'ask to view departments catalogues (e.g. catalog computer science undergraduate)',
  'ask to see useful links related to AUB (e.g. links)',
  'ask for a building\'s image (e.g. nicely hall)',
  'ask for info/description about a specific course (e.g. info about cmps 200)',
  'ask for the courses offered for a specific subject (e.g. cmps courses)',
  'ask for courses with a specific attribute (e.g. natural sciences courses)',
  'ask for lectures for a certain course (e.g. cmps 200 lectures in bliss hall on mwf)',
  'ask for lectures in a specific place and/or day(s) (e.g. lectures in nicely hall on tuesday and thursday)' ,
  'ask for the title or name of a course you heard of (e.g. title of cmps 255)',
  'ask for info about instructors if you know their first and/or last names (e.g. faculty bdeir)',
  'ask for the email of an instructor (e.g. email bdeir)',
  'ask for tuition of a certain department (e.g. tuition computer science)',
  'ask for a study plan for a certain major and degree (e.g. study plan computer science undergraduate)'
]

const printThingsToDo = function () {

  var result = '';

  things_to_do.forEach( (element) => {
    result += `📙 ${element}\n\n`;
  })

  return result;
}

const HelpMessage = `Here are some of the things that you could do:\n\n${printThingsToDo()}`;


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

  logger.log(action, Logger.severity.debug);
  logger.log(parameters, Logger.severity.debug);

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
          return displayQuery(userId, data, request);
        }
      }
      return sendTextMessage(userId, 'There is nothing to show for now');
      break;
    case 'links.show':
      return fb_api.sendUniversityLinks(userId);
      break;
    case 'courses.core':
      dbm.requestStoredQuery(userId, 'courses', dbm.formatCourses);
      var request = dbm.getRequest(userId);
      var data = request.nextPage();
      if (!!data) {
        return fb_api.displayQueryMessage(userId, request.formatter(data, request.page(), request.last()));
      }
      break;
    case 'courses.subject':
      dbm.executeQuery(dbm.queries.get_courses_for(parameters['subj'].toUpperCase()), (res) => {
        return handleRequest(userId, res, dbm.formatCourses);
      })
      break;

    case 'courses.attribute':
      dbm.executeQuery( dbm.queries.get_courses_by_attribute(parameters['attr']), (res) => {
        return handleRequest(userId, res, dbm.formatCourses);
      });
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
    case 'courses.info':

      var subj = parameters['subj'].toUpperCase();
      var code  = parameters['code'].toUpperCase();

      dbm.executeQuery( dbm.queries.get_course_info(subj, code), (res) => {
        if(res.length > 0){
          var course = res[0];
          // even though formatting should be in database manager formatter but the query is very simple
          // and easy to modify
          var course_info = `${course.subj} ${course.code} - ${course.title}\n\n${course.description}`;
          return sendTextMessage(userId, course_info);
        }else{
          return sendTextMessage(userId, ErrorMessage);
        }
      });
      break;
    case 'lectures.building':
      
      var building = parameters['in'].toUpperCase();
      var subj = (!!parameters['subj'] ? parameters['subj'].toUpperCase() : subj);
      var code  = (!!parameters['code'] ? parameters['code'].toUpperCase() : code);

      dbm.executeQuery(dbm.queries.get_lectures_in(building, subj, code), (res) => {
       return handleRequest(userId, res, dbm.formatLectures);
      })
      break;
    case 'lectures.days':
      var days = parameters['on'].toUpperCase();
      var subj = (!!parameters['subj'] ? parameters['subj'].toUpperCase() : subj);
      var code  = (!!parameters['code'] ? parameters['code'].toUpperCase() : code);
      var validation = isValidDay(days);
      if(validation === true){
        dbm.executeQuery( dbm.queries.get_lectures_on(days, subj, code), (res) => {
          return handleRequest(userId, res, dbm.formatLectures);
        })
      }else{
        return sendTextMessage(userId, validation.error_msg);
      }
      break;
    case 'lectures.building_and_days':
      var bldg = parameters['in'].toUpperCase();
      var days = parameters['on'].toUpperCase();
      var subj = (!!parameters['subj'] ? parameters['subj'].toUpperCase() : subj);
      var code  = (!!parameters['code'] ? parameters['code'].toUpperCase() : code);
      var validation = isValidDay(days);
      if(validation === true){
        dbm.executeQuery( dbm.queries.get_lectures_in_on(bldg, days, subj, code) , (res) => {
          return handleRequest(userId, res, dbm.formatLectures);
        })
      }else{
        return sendTextMessage(userId, validation.error_msg);
      }
      break;
    case 'lectures.course':
      var subj = parameters['subj'].toUpperCase();
      var code  = (!!parameters['code'] ? parameters['code'].toUpperCase() : code);;

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
          if(res.length == 1){
            if(!!res[0].image_url){
              fb_api.sendImageMessage(userId, res[0].image_url);
            }
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

    case 'issues.prompt':
      fb_api.displayReportMessage(userId);
      break;
    case 'issues.message':
      dbm.executeQuery( dbm.queries.submit_issue(userId, parameters['msg']), (res) => {
        // successfully been replaced by a logger
        logger.log('an issue has been recorded, please check the issues dataset!', Logger.severity.critical);
        return sendTextMessage(userId, "Okay, I have notified my team so they can fix your problem as soon as possible! 👌");
      });
      break;

    case 'tuitions.core':
      var dep = parameters['dep'];
      var deglvl = parameters['deglvl'];
      dbm.executeQuery( dbm.queries.get_tuition(dep, deglvl), (res) => {
        if( res.length > 0){
          return sendTextMessage(userId, dbm.formatTuition(res) );
        }else{
          return sendTextMessage(userId, ErrorMessage);
        }
      });
      break;

    case 'info.get':
      var tag = parameters['tag'];
      dbm.executeQuery( dbm.queries.get_info(tag), (res) => {
        
        var info = res[0];

        if(!!info.default_action_url){
          return fb_api.sendGenericTemplate(userId, info.title, info.value, info.image_url, info.default_action_url);
        }else if(!!info.image_url){
          fb_api.sendImageMessage(userId, info.image_url);

          if(!!info.value){
            sendTextMessage(userId, info.value);
          }
          return;
        }else{
          return sendTextMessage(userId, info.value);
        }
        
      });
      break;
    case 'studyplan.core':
      var major = parameters['major'];
      var deglvl = parameters['deglvl'];
      dbm.executeQuery( dbm.queries.get_studyplan(major, deglvl) , (res) => {
        if(res.length === 1){
          return sendTextMessage(userId, res[0].value);
        }else{
          return sendTextMessage(userId, ErrorMessage);
        }
      });
      break;
    case 'buildings.show':
      var bldgname = parameters['bldgname'];
      dbm.executeQuery( dbm.queries.get_building_image(bldgname), (res) => {
        if(res.length > 0){
          var image = res[0].image_url;
          return fb_api.sendImageMessage(userId, image);
        }else{
          return sendTextMessage(userId, ErrorMessage);
        }
      });
      break;
    case 'catalogue.core':
      var dep = parameters['dep'];
      var deglvl = parameters['deglvl'];
      dbm.executeQuery( dbm.queries.get_catalogue(dep, deglvl), (res) => {
        if (res.length > 0){
          var catalogue = res[0];
          return fb_api.sendFileMessage(userId, catalogue.link);
        }else{
          return sendTextMessage(userId, ErrorMessage);
        }
      })
      break;
    case 'departments.core':
      dbm.executeQuery( dbm.queries.get_departments(), (res) => {
        return handleRequest(userId, res, dbm.formatDepartments);
      });
      break;
    case 'buildings.core':
      dbm.executeQuery( dbm.queries.get_buildings(), (res) => {
        return handleRequest(userId, res, dbm.formatBuildings);
      });
      break;
    default: logger.log('there must be something wrong with the parsed action!', Logger.severity.error);
  }
}


var issueState = {} // map of users who are in the issue state

function runIssueState (userId, event) {

  if(!!issueState[userId]){
    var msg = event.message.text;
    msg = msg.replace(/"/g, "'");
    runAction(userId, msg , `#issues.message > msg:${msg}`);
    delete issueState[userId];
    return true;
  }

  if(!!event.message.quick_reply){
    
    if(event.message.quick_reply.payload == 'REPORT_YES'){
      issueState[userId] = userId;
      sendTextMessage(userId, 'please describe for me your issue that you have ran into 📝');
      return true;
    }

    if(event.message.quick_reply.payload == 'REPORT_NO'){
      sendTextMessage(userId, 'okay glad to hear that! 😁');
      return true;
    }

  }


  return false;


}

function runNextState (event, userId){

  if(!!event.message.quick_reply && event.message.quick_reply.payload == 'NEXT_PAGE'){
    return false;
  }

  return false;
}

function checkState (event, userId){

  return runIssueState(event, userId) || runNextState(event, userId);
}


//--------------------------------------------------------------------------------

// this is the function that recieves and process the message

module.exports = (event) => {

  const userId = event.sender.id;
  const message = event.message.text;

  const msg = sc.correct(message.toLowerCase()); // do spell checking before processing

  // see what users might say to the bot for analysis
  dbm.executeQuery( dbm.queries.get_client(userId), (res) =>{
    if(res.length > 0){
      var first_name = res[0].first_name;
      var last_name = res[0].last_name;
      logger.log(`{${first_name + ' ' + last_name}}: "${msg}"`, Logger.severity.debug);
    }
  });

  var stateOccured = runIssueState(userId, event); // note: if there are many states then we would implement a state-manager module

  if(!stateOccured){
    // let the natural language manager handle the message
    nlp.getResponse(userId, msg, (response) => {

      // run action if an action exists
      if (!!response.action) {

        var answerFound = false;

        if(!!response.answer){
          sendTextMessage(userId, response.answer);
          answerFound = true;
        }

        setTimeout(() => {
          runAction(userId, msg, response.action);
        }, (answerFound ? 1000 : 0));
        
      } else if(!!response.answer) {
        return sendTextMessage(userId, response.answer);
      }else{
        //TODO: make better answer not found messages
        logger.log(`message with unresolved None intent: "${msg}"`, Logger.severity.error);
        return sendTextMessage(userId, 'I still have not learned to answer this');
 
      }

    });
  }

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