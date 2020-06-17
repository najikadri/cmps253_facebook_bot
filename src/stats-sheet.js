/**
 * This module handles collecting data about the user questions and responses to further analyze the results
 * and do statistics over it to improve the chatbot interaction with the users and make the experience more
 * human-like. The module connects to a Google Sheet from the cloud to insert the data where it can be shared online
 * for later analysis.
 */

const { GoogleSpreadsheet } = require('google-spreadsheet');

const creds = require('../client_secret.json'); // Google API credentials


class StatsSheet {


    constructor() {

        if(!!StatsSheet.instance){
            return StatsSheet.instance;
        }

        // The Google Sheet document in Google Drive
        this.doc = new GoogleSpreadsheet('1vwP6LDGXFNZ7dMdEVnQ0Qm8AcZj0D9-JrfOFbELxqYI');

        this.loadDocument();

        return this;

    }

    entry = {};

    // an entry template to enter in the document
    entry_template = {
        Message: '<message>',
        Response: '<response>',
        Intent: '<intent>',
        Action: '<action>'
    }

}


// authenticate access to the Google Sheet document and load the document
StatsSheet.prototype.loadDocument = async function () {
    this.doc.useServiceAccountAuth(creds).then( () => {
        this.doc.loadInfo().then( () => {
            this.sheet = this.doc.sheetsByIndex[0];
        })
    })
}

// update current entry (row) that we are trying to build
StatsSheet.prototype.updateEntry = function(entry){

    if(!!entry.Message){
        this.entry.Message = entry.Message;
    }

    if(!!entry.Response){
        this.entry.Response = entry.Response;
    }

    if(!!entry.Intent){
        this.entry.Intent = entry.Intent;
    }

    if(!!entry.Action){
        this.entry.Action = entry.Action;
    }
}

StatsSheet.prototype.clearEntry = function() {
    this.entry = {};
}

// add entry to the Google Sheet document on Google Drive
StatsSheet.prototype.applyEntry = async function () {

    this.sheet.addRow(this.entry).then( () => {
        this.clearEntry();
    });
}


module.exports = { instance : () => new StatsSheet() };