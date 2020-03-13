// simple function to get a file relative to the current file's directory
const path = require('path');
module.exports = function(relative_path){
    return path.join(__dirname, relative_path);
}