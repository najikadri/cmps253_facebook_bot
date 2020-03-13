const processMessage = require('./process-message');
const processPostback = require('./process-postback');

    module.exports = (req, res) => {

      global.host = req.hostname;
      
      if (req.body.object === 'page') {
        req.body.entry.forEach(entry => {
          entry.messaging.forEach(event => {

            // process regular messages
            if (event.message && event.message.text) {
              processMessage(event);
            }

            // process postbacks here
            if(event.postback){
              processPostback(event);
            }

          });
        });

        res.status(200).end();
      }
    };