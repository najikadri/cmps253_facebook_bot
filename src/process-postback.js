const fetch = require('node-fetch');
const getstarted = require('./get-started');
const dbm = require('./database-manager').instance();
const { displayQuery, handleRequest } = require('./query-request-handler');


// this function handles and processes postbacks 

module.exports = (event) => {
    const userId = event.sender.id;
    const payload = JSON.parse(event.postback.payload);
    // extracting infromation from a payload
    const type = payload.type;
    const message = payload.message;

    if(type == 'FAQS'){
        switch(payload.category){
            case 'PNP':
                dbm.executeQuery("SELECT * FROM faqs WHERE category='P/NP Grading'", (res) => {
                    return handleRequest(userId, res, dbm.formaFaqs, 1);
                });
                break;
            case 'RI':
                dbm.executeQuery("SELECT * FROM faqs WHERE category='Registration issues'", (res) => {
                    return handleRequest(userId, res, dbm.formaFaqs, 1);
                });
                break;
            case 'GS':
                dbm.executeQuery("SELECT * FROM faqs WHERE category='Graduate studies'", (res) => {
                    return handleRequest(userId, res, dbm.formaFaqs, 1);
                });
                break;
        }
    }

    if(message == 'Get Started'){
        getstarted(userId);
    }
    
};