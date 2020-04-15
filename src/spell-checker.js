// a module and a singleton class that uses a corpus file to spell check text and messages
// it uses Natural module which will read the corpus file and determine for each
// word if it spelled correctly and fix any spelling mistakes based on the corpus words

const natural = require('natural');
const goto = require('./goto');
const fs = require('fs');
const readline = require('readline');


class SpellCheker {

    corpus = []

    // done is a callback function and it is called once
    // the spellchecker is done loading the corpus file
    constructor(done) {

        if(!!SpellCheker.instance){
            return SpellCheker.instance;
        }

        // read the corpus file and store the words

        var lineReader = readline.createInterface({
            input: fs.createReadStream(goto('corpus.txt'))
        });

        lineReader.on('line', (line) => {
            if(line == '' || line.startsWith('//') ){
                return;
            }

            this.corpus.push(line);

        }).on('close', (line) => {
            this.checker = new natural.Spellcheck(this.corpus); // use natural spell checker
            done(); // done callback function
        })

        SpellCheker.instance = this;

        return this;
    }
}

// this function corrects text spelling mistakes
SpellCheker.prototype.correct =  function(text){
    text = text.split(' ');

    for(var i = 0; i < text.length; i++){
        var corrections = this.checker.getCorrections(text[i], 2);
        if( corrections.length > 0){
            text[i] = corrections[0]; // get the first possible correction 
        }
    }

    result = text.join(' ');

    return result;
}

module.exports = { instance : function(done) { return new SpellCheker(done) } };
