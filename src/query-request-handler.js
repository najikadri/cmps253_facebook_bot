// this is a common module that is used by both processMessage & processPostback to handle queries
// and their format
const dbm = require('./database-manager').instance();
const fb_api = require('./fb-api').instance();
const sendTextMessage = fb_api.sendTextMessage; // a shortcut

const ErrorMessage = "Sorry I couldn't find any results for your request. 😕";

// this function decides whether to display next button or not with the current query
const displayQuery = function(userId, data, request)
{
  if(request.page() === request.last()){
    return sendTextMessage(userId, request.formatter(data, request.page(), request.last()));
  }else{
    return fb_api.displayQueryMessage(userId, request.formatter(data, request.page(), request.last()));
  }
}

// a function to handle custom queries requests
const handleRequest = function(userId, res, formatter, partition_size = 10) {
  dbm.requestCustomQuery(userId, res, formatter, partition_size);
  var request = dbm.getRequest(userId);
  var data = request.nextPage();
  if(!!data){
    displayQuery(userId, data, request);
  }else{
    return sendTextMessage(userId, ErrorMessage);
  }
}

module.exports = {
    displayQuery,
    handleRequest,
    ErrorMessage
}