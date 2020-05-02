const env = process.env.NODE_ENV || 'development';
const { createLogger, Logger } = require('./logger');
const logger = createLogger();

// Remember the Page Access Token you got from Facebook earlier?
// Don't forget to add it to your `variables.env` file.
if(env === 'development'){
    logger.log('current environment is development', Logger.severity.info);
    const { FACEBOOK_ACCESS_TOKEN_DEV } = process.env;
    var FB_ACCESS_TOKEN = FACEBOOK_ACCESS_TOKEN_DEV;
}else{
    logger.log('current environment is production', Logger.severity.info);
    const { FACEBOOK_ACCESS_TOKEN } = process.env;
    var FB_ACCESS_TOKEN = FACEBOOK_ACCESS_TOKEN;
}

module.exports = FB_ACCESS_TOKEN;