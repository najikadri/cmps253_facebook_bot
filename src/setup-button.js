
const request = require("request");
const FACEBOOK_ACCESS_TOKEN = require('./fb_access_token');

function setupGetStartedButton(res){
    
    var messageData = {
        "get_started":{
           "payload":"{\"type\":\"legacy_reply_to_message_action\",\"message\":\"Get Started\"}"
         }
     };


    // Start the request
    request({
        url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token='+ FACEBOOK_ACCESS_TOKEN,
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        form: messageData
    },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            console.log("setup button added successfully");
            res.send(body);

        } else { 
            // TODO: Handle errors
            res.send(body);
        }
    });
}     

module.exports = setupGetStartedButton;