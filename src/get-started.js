// this is a basic function module to load the get started / help message
const fb_api = require('./fb-api').instance();
const sendTextMessage = fb_api.sendTextMessage; // shortcut
const dbm = require('./database-manager').instance();
const logger = require('./logger').instance();
const Logger = require('./logger').Logger;

// we are using aync since the getprofile function is async and we need to 
// wait for the promise to return the pending results
module.exports = async (userId) => {


   var profile = await fb_api.getProfileInfo(userId);

   var first_name = profile.first_name;
   var last_name = profile.last_name;

   first_name = (first_name == undefined ? 'null' : `'${first_name}'`);
   last_name = (last_name == undefined ? 'null' : `'${last_name}'`);


   // add user to database if not found
   if (! dbm.userFound(userId) ){
       dbm.executeQuery(dbm.queries.add_user(userId, first_name, last_name), ( _ ) => {
           dbm.storeQuery(dbm.queries.get_users(), 'users'); // retreive all user after adding the new user
           logger.log(`user ${profile.first_name + ' ' + profile.last_name} has been successfully added`, Logger.severity.info);
       });
   }

   var message  = `Hello ${profile.first_name}! 😃 I'm here to help you to answer your questions about the computer science department in the American Univeristy of Beirut.\nAsk me anything you would like to know or type help and I'll walk you through.`;
   message += `\nIf you are facing any problem please do let me know! 😊`;

    return sendTextMessage(userId, message);



};