const fs = require("fs");
const colors = require("colors"); // used to color the text in console

// a simple singleton class to manage logging to console, files, and other mediums
class Logger {

    constructor(settings) { 

        if(!!Logger.instance){
            return Logger.instance;
        }

        this._settings.logFile = settings.logFile;
        this._settings.debugFile = settings.debugFile;
        this._settings.errorFile = settings.errorFile;

        // make sure that settings object is always passed right
        if (!settings.logFile || !settings.debugFile || !settings.errorFile) {
            throw "Incomplete settings";
        }


        // severity ENUM
        Logger.severity = {
            info: 0, // green
            debug: 1, // blue
            error: 2, //orange
            critical: 3 // red
        }

        this.log('logger module successfully initialized', Logger.severity.info);

        Logger.instance = this;
        return this;
    }

    // the logger configurations
    _settings = {
        logFile: undefined,
        debugFile: undefined,
        errorFile:undefined

    } 
}


//---------------------------------------------------------------------------

// FORMATTING FUNCTIONS

Logger.prototype._padZero = function (num) {
    if (num <= 9) {
        return "0" + num;
    }
    return num;
}

// add colors if the message is for console otherwise return regular string
Logger.prototype._formatSeverity = function (severity,isConsole = false) {
    switch (severity) {
        case Logger.severity.info:
            return (isConsole ? "INFO".green : "INFO");
        case Logger.severity.debug:
            return (isConsole ? "DEBUG".blue : "DEBUG");
        case Logger.severity.error:
            return (isConsole ? "ERROR!".yellow : "ERROR!");
        case Logger.severity.critical:
            return (isConsole ? "CRITICAL!".red : "CRITICAL!");
    }
}

Logger.prototype._formatDate = function () {
    
    let current_date = new Date();
    return (this._padZero(current_date.getDate()))  + "/" + (this._padZero(current_date.getMonth())) + "/" + current_date.getFullYear();
}

Logger.prototype._formatTime = function () {
    let current_time = new Date();
    return (this._padZero(current_time.getHours())) + ":" + (this._padZero(current_time.getMinutes())) + ":" + (this._padZero(current_time.getSeconds()));
}

Logger.prototype._formatMessage = function (message, severity, isConsole = false) {
    return `[${this._formatDate()} ${this._formatTime()}] ${this._formatSeverity(severity, isConsole)}: ${(typeof message == 'string' ? message : JSON.stringify(message))}`;
}

//---------------------------------------------------------------------------

//---------------------------------------------------------------------------

// LOG FUNCTIONS

Logger.prototype._logtoConsole = function (message, severity) {
    console.log(this._formatMessage(message, severity, true));
}

Logger.prototype._logtoFile = function (message, severity, filename) {
    fs.appendFile(filename, this._formatMessage(message, severity) + '\n' , (err) => {
        if (err) {
            this._logtoConsole(`Cannot Open File "${filename}"`, Logger.severity.error);
        }     
    }
    );
}

// main log function, only use this to log
Logger.prototype.log = function(message,severity) {
    // do logging based on the severity
    switch (severity) {
        case Logger.severity.info:
            this._logtoConsole(message, severity);
            this._logtoFile(message, severity, this._settings.logFile);
            break;
        case Logger.severity.debug:
            this._logtoConsole(message, severity);
            this._logtoFile(message, severity, this._settings.logFile);
            this._logtoFile(message, severity, this._settings.debugFile);
            break;
        case Logger.severity.error:
            this._logtoConsole(message, severity);
            this._logtoFile(message, severity, this._settings.logFile);
            this._logtoFile(message, severity, this._settings.errorFile);
            break;
        case Logger.severity.critical:
            this._logtoConsole(message, severity);
            this._logtoFile(message, severity, this._settings.logFile);
            this._logtoFile(message, severity, this._settings.errorFile);
            break;
    }
}


//---------------------------------------------------------------------------

// export the class to be used in other module files
module.exports = { instance: function () { return new Logger() }, init: function(settings) {return new Logger(settings)} };
module.exports.Logger = Logger; // to use the severity enums