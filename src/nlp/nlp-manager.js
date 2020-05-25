/**
 * This module is responsible for the management and interaction between the users (facebook users) and the 
 * chat bot. It will allow the program to use basic NLP and AI technologies to be able to find the right response and
 * process the users text and know their intent.
 * 
 * There are two inputs : facebook id of the user, and the message sent by the user
 * The output is an NLP object that will containt the following:
 *  1- response.answer : regular string that contains the response by the nlp bot
 *  2- response.action: which tell the bot to process this message as an action rather than a plain reply
 *      and its syntax is #<action_category>.<action> > [<parm_name>:<parm_value> , ...]*
 * 
 *  example: #lectures.building_and_days > in:bliss , on:mwf
 */

const dbm = require('../database-manager').instance();
const { dockStart } = require('@nlpjs/basic');
const goto = require('../goto');
const format = require('./nlp-format');
const { createLogger, Logger } = require('../logger');
const logger = createLogger();


class NaturalLanguageManager {

    constructor() {

        if(!!NaturalLanguageManager.instance){
            return NaturalLanguageManager.instance;
        }

        NaturalLanguageManager.instance = this;

        // setup the Natural Language Manager

        (async() => {

            this.dock = await dockStart({ use: ['Basic']});

            var nlp = this.dock.get('nlp');
            var ner = this.dock.get('ner');

            ner.applySettings(ner.settings, { threshold : 1.0 });

            // train the Natural Language Processer

            setup_NLP(nlp);

            // add entities for NER (Name Entity Recognition)

            setup_NER(ner);

            // var stdin = process.openStdin();
            // stdin.addListener("data", function(textObj) {

            //     var message = textObj.toString().trim();

            //     if(message == 'exit' || message == 'quit'){
            //         process.exit(0);
            //     }
                
            //     nlp.process('en', message).then( (response) => {
            //         console.log(response);
            //     });
    
            //   });




        })();

        return this;

    }


}

// add corpus and train everytime since loading file in NLP has a bug
async function setup_NLP(nlp){
    await nlp.addCorpus(goto('nlp/nlp-corpus.json'));
    await nlp.train();
}

// this function is used to setup used entities to be used in our processing
function setup_NER(ner){

    //TODO: bug: if two entities share same text value then only one will be used
    // example: we have CHEM course and CHEM building but NLP will always see CHEM as building for some reason

    dbm.connection.connect( (err) => {

        if(err){
            throw err;
        }

        // add courses subject entities 
        // note: removed info from subj because it shadows the keyword info in the intent
        dbm.executeQuery( 'SELECT DISTINCT subj FROM course WHERE subj <> "INFO";' , (res) => {
            ner.addRuleOptionTexts('en','course','subject', res.map((course) => course.subj));
        });
        
        // add courses code regex entity
        ner.addRegexRule('en', 'course_code', /[0-9]{3}[-]*[a-zA-Z]{0,2}/g);

        // add courses attributes entities
        dbm.executeQuery( "SELECT DISTINCT REPLACE(attribute, 'I', '') as attribute from course WHERE attribute IS NOT NULL;" , (res) => {
            ner.addRuleOptionTexts('en','course_attribute','attribute', res.map((course) => course.attribute.trim() ));
        });

        // add datetime day entity
        ner.addRuleOptionTexts('en', 'datetime','day', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
        ner.addRuleOptionTexts('en', 'datetime', 'day_shortcut', ["M", "T", "W", "R", "F", "TR", "WF", "MW", "MWF"]);

        // add building entities
        dbm.executeQuery( "SELECT DISTINCT alias from building WHERE alias IS NOT NULL;" , (res1) => {
            dbm.executeQuery( 'SELECT DISTINCT bldgname from building;', (res2) => {
                var names1 = res1.map( (building) => building.alias );
                var names2 = res2.map( (building) => building.bldgname );
                ner.addRuleOptionTexts('en','building','name',   names1.concat(names2));
            });
        });


        // add instructor entities
        dbm.executeQuery ( 'SELECT DISTINCT first_name FROM instructor;',  (res1) => {
            var first_names = res1.map( (instructor) => instructor.first_name);

            dbm.executeQuery( 'SELECT DISTINCT last_name FROM instructor;', (res2) => {
                var last_names = res2.map( (instructor) => instructor.last_name);

                ner.addRuleOptionTexts('en','instructor','first_name', first_names);
                ner.addRuleOptionTexts('en','instructor','last_name', last_names);

            });
    
        });

        // add info entities
        ner.addRuleOptionTexts('en','info','keyword', 
            ['president', 'chairman', 'chairperson', 'chairwoman', 'chair', 'contact', 'department', 'dep' , 'news', 'dean']
        );

        // add faculties

        ner.addRuleOptionTexts('en', 'faculty', 'name',
            ['arts and sciences', 'fas']
        );

        // add degree entities
        ner.addRuleOptionTexts('en','degree','level', ['undergraduate', 'undergrad', 'graduate', 'grad', 'freshman', 'doctorate']);

        dbm.executeQuery( 'SELECT DISTINCT faculty_name FROM department;', (res) => {
            logger.log(`NER faculties loaded with ${res.length} entities`, Logger.severity.debug);
            ner.addRuleOptionTexts('en', 'degree', 'faculty', res.map( (fac) => fac.faculty_name ));
        });

        dbm.executeQuery( 'SELECT name FROM department;', (res) => {
            logger.log(`NER faculties departments with ${res.length} entities`, Logger.severity.debug);
            ner.addRuleOptionTexts('en', 'degree', 'department', res.map( (dep) => dep.name));
        });
    });


    

}

// this function takes a facebook id and a message returns the correct response or <action>
// for the bot to process
NaturalLanguageManager.prototype.getResponse = function(fid, msg, successFunc) {

    var nlp = this.dock.get('nlp');

    nlp.process(msg).then( (response) => {
        format(response, successFunc);
    });

}

module.exports = { instance : function() { return new NaturalLanguageManager() } };

