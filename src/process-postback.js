const fetch = require('node-fetch');
const getstarted = require('./get-started');


// this function handles and processes postbacks 

module.exports = (event) => {
    const userId = event.sender.id;
    const title = event.postback.title;
    const payload = JSON.parse(event.postback.payload);
    // extracting infromation from a payload
    const type = payload.type;
    const message = payload.message;

    if(message == 'Get Started'){
        getstarted(userId);
    }
    
};