const fetch = require('node-fetch');
const dbm = require('./database-manager').instance(); // create an instance of our database manager
const path = require('path');
const fb_api = require('./fb-api').instance();
const sendTextMessage = fb_api.sendTextMessage; // a shortcut
const getstarted = require('./get-started');

//---------------------------------------------------
// SETUP & STORE COMMON QUERIES


dbm.storeQuery( dbm.queries.get_courses(), 'courses');
dbm.storeQuery( dbm.queries.get_lectures(), 'lectures');
dbm.storeQuery( dbm.queries.get_rooms(), 'rooms');
dbm.storeQuery( dbm.queries.get_users(), 'users');


// dbm.storeQuery ( dbm.queries.get_rooms_used(), 'rooms_used');

//---------------------------------------------------


// UNDEFINED BEHAVIOR/TEXT MESSAGES
// these messages are sent when the bot doesn't understand
// what is the intent of what the user is saying

// note to self: remember self-invoking functions if needed

const getErrorMessage = async function (userId){

  var profile = await fb_api.getProfileInfo(userId);

  var first_name = profile.first_name;

  if(first_name == undefined){
      first_name = '';
  }

  var messages = [
    `Sorry ${first_name}, can you repeat that? I didn't get it.`,
    `I don't know what are you talking about ${first_name}`,
    'Can you repeat please?',
    'I might not have learned to do that',
    `Please try something else ${first_name}`
  ]

  return messages[Math.floor(Math.random() * messages.length)]
}


//


    // Remember the Page Access Token you got from Facebook earlier?
    // Don't forget to add it to your `variables.env` file.
    const { FACEBOOK_ACCESS_TOKEN } = process.env;



    // this is the function that recieves and process the message

    module.exports = (event) => {
      const userId = event.sender.id;
      const message = event.message.text;

      const msg = message.toLowerCase();


      //TODO: Use NLP later to process the user's intent naturally and extract data

      // we are using regular expressions for now which are not very efficient compared to NLP

      var lib = /view lectures in \s*(\w+)/g.exec(msg); // lib = lectures in building

      if(lib != null){


        dbm.executeQuery(dbm.queries.get_lectures_in(lib[1].toUpperCase()), (res) => {
        dbm.requestCustomQuery(userId, res, dbm.formatLectures);
        var request = dbm.getRequest(userId);
        var data = request.nextPage();
        if (!!data) {
          return sendTextMessage(userId, request.formatter(data, request.page(), request.last()));
        }
      });

      return;
      
      }

      var lad = /view lectures at (days)?\s*(\w+)/g.exec(msg); // lad = lectures at days

      if(lad != null){

        var days = lad[2];

        days = days.toUpperCase();

        var valid_days = ['M','T','W','R','F','TR', 'WF', 'MW', 'MWF'];

        if(valid_days.includes(days)){ // check if it is a valid day value

          dbm.executeQuery(dbm.queries.get_lectures_at(lad[2].toUpperCase()), (res) => {
            dbm.requestCustomQuery(userId, res, dbm.formatLectures);
            var request = dbm.getRequest(userId);
            var data = request.nextPage();
            if (!!data) {
              return sendTextMessage(userId, request.formatter(data, request.page(), request.last()));
            }
          });

          return;

        }else{ // otherwise tell the user what are the valid ones
          let error_msg = 'available days values are: \n';
          for ( var i = 0; i < valid_days.length; i++){
            error_msg += `"${valid_days[i]}"`;
            if (i < valid_days.length - 1){ error_msg += ', ';};
          }

          return sendTextMessage(userId, error_msg);

        }
      }


      
      if(msg == 'help'){
       return getstarted(userId);
      }

      if(msg == 'next' || msg == 'show next'){

        var request = dbm.getRequest(userId);

        if(!! request){

          var data = request.nextPage();

          if(!!data){
            return sendTextMessage(userId, request.formatter(data, request.page(), request.last()));
          }
        }

        return sendTextMessage(userId, 'There is nothing to show for now');
        
      }


      if( msg == 'view courses'){

        dbm.requestStoredQuery(userId, 'courses', dbm.formatCourses);
        var request = dbm.getRequest(userId);
        var data = request.nextPage();

        if(!!data){
          return sendTextMessage(userId, request.formatter(data, request.page(), request.last()));
        }


      }else if ( msg == 'view lectures'){

        dbm.requestStoredQuery(userId, 'lectures', dbm.formatLectures);
        var request = dbm.getRequest(userId);
        var data  = request.nextPage();

        if(!!data){
          return sendTextMessage(userId, request.formatter(data, request.page(), request.last()));
        }

      }else if ( msg == 'view rooms'){
        dbm.requestStoredQuery(userId, 'rooms', dbm.formatRooms);
        var request = dbm.getRequest(userId);
        var data = request.nextPage();

        if(!!data){
          return sendTextMessage(userId, request.formatter(data, request.page(), request.last()));
        }

        // return sendTextMessage(userId, `${global.host}/view/rooms`);
      }else{

        // self-invoking functions are awesome (kinda)
        (async function(userId) {
          var error_msg = await getErrorMessage(userId);
          return sendTextMessage(userId, error_msg);
        })(userId);

      }

     
    }


// My own defined functions and methods for the application

var getStarted = function (user_id) {
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
              quick_replies : [
                  {
                    content_type: "text",
                    title: "Play Game",
                    payload  : "PLAY"
                    // image_url :"http://example.com/img/green.png"   // use to add images to quick replies 
                  },
                  {
                    content_type: "text",
                    title: "Chit Chat",
                    payload  : "CHAT"
                  }
              ]
            },
          }),
        }
      );
}