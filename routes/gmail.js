module.exports = function(app) {

    var Handler = require('../handlers/gmail.js').Handler;
    var handler = new Handler(app);
    var tools = require('../tools/tools.js');
    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);

    app.get('/rest/gmail/auth', function(req, res) {
        console.log(req);
        console.log('PIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII');
        var a = {a: 1};
        res.json(a);
        res.end();
    });

    app.get('/rest/gmail/emails', function(req, res) {
        var token = tools.extractToken(req);

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getEmails()
            })
            .then(function(emails) {
                res.json(emails);
                res.end();
            })
            .fail(function(err) {
                tools.replyError(err, res);
            })
            .done();
        } else {
            res.status(403).send({message: 'No authentication token!'});
        }
    });

    app.post('/rest/gmail/emails', function(req, res) {
        var token = tools.extractToken(req);

        var email = req.body;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.sendEmail(email)
            })
            .then(function(result) {
                res.json(result);
                res.end();
            })
            .fail(function(err) {
                tools.replyError(err, res);
            })
            .done();
        } else {
            res.status(403).send({message: 'No authentication token!'});
        }
    });

}