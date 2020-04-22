/**
 * This module is responsible for the management and interaction between the users (facebook users) and the 
 * chat bot. It will allow the program to use basic NLP and AI technologies to be able to find the right response and
 * process the users text and know their intent.
 * 
 * There are two inputs : facebook id of the user, and the message sent by the user
 * The outputs are:
 *  1- Response: regular string that contains the response by the nlp bot
 *  2- <ACTION>: which tell the bot to process this message as an action rather than a plain reply
 *      and its syntax is #<action_category>.<action> > [<parm_name>:<parm_value> , ...]*
 * 
 *  example: #lectures.building_and_days > in:bliss , on:mwf
 */

const natural = require('natural');
const RiveScript = require('rivescript');
const goto = require('./goto');
const logger = require('./logger').instance();
const Logger = require('./logger').Logger;

class NaturalLanguageManager {

    constructor() {

        if(!!NaturalLanguageManager.instance){
            return NaturalLanguageManager.instance;
        }

        NaturalLanguageManager.instance = this;

        this.rivescript = new RiveScript({utf8: true});

        // load rivescript scripts directory and sort replies to use the nlp bot
        this.rivescript.loadDirectory(goto('./brain')).then(() => {
            logger.log('NLP files loaded successfully', Logger.severity.info);
            this.rivescript.sortReplies();

        }).catch(() => {logger.log('cannot load NLP files', Logger.severity.error);});

        return this;

    }


}

// this function takes a facebook id and a message returns the correct response or <action>
// for the bot to process
NaturalLanguageManager.prototype.getResponse = function(fid, msg, successFunc) {
        this.rivescript.reply(fid, msg).then((response) =>{
            successFunc(response);
        });}

module.exports = { instance : function() { return new NaturalLanguageManager() } };

