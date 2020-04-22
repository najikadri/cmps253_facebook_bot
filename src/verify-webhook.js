const verifyWebhook = (req, res) => {

    const { VERIFY_TOKEN } = process.env;

    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if( mode && token == VERIFY_TOKEN){
        res.status(200).send(challenge);
    }else{
        res.sendStatus(403);
    }

    global.host = req.hostname;
}

module.exports = verifyWebhook;