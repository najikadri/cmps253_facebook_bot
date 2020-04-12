// this is a basic function module to load the get started / help message
const fb_api = require('./fb-api').instance();
const sendTextMessage = fb_api.sendTextMessage; // shortcut
const dbm = require('./database-manager').instance();

// we are using aync since the getprofile function is async and we need to 
// wait for the promise to return the pending results
module.exports = async (userId) => {


   var profile = await fb_api.getProfileInfo(userId);

   var first_name = profile.first_name;

   if(first_name == undefined){
       first_name = '';
   }


   // add user to database if not found
   if (! dbm.userFound(userId) ){
       dbm.executeQuery(dbm.queries.add_user(userId), (res) => {
           dbm.storeQuery(dbm.queries.get_users(), 'users'); // retreive all user after adding the new user
           console.log('user has been successfully added');
       });
   }

   var message  = `Hello ${first_name}! 😃 I'm here to help you to answer your questions about the computer science department in the American Univeristy of Beirut.\nAsk me anything you would like to know or type help and I'll walk you through.`;
   message += `\nIf you are facing any problem please do let me know! 😊`;

    return sendTextMessage(userId, message);



};