module.exports = function(app) {

    var Handler = require('../handlers/gmail.js').Handler;
    var handler = new Handler(app);
    var tools = require('../tools/tools.js');
    var {google} = require('googleapis');
    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);

    var REDIRECT_URL = app.get('gmail-redirect-uri');

    var oauth2Client = new google.auth.OAuth2(
        "40328072649-psndcgjb1ge0al6uefog49809hu2dj6r.apps.googleusercontent.com",
        "9mtWNhB2lFg5MQK9T9R2IrxG",
        REDIRECT_URL
      );

      var scopes = [
        'https://mail.google.com'
      ];

      var url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',

        // If you only need one scope you can pass it as a string
        scope: scopes
      });

    app.get('/rest/gmail/auth', function(req, res) {
        res.send(url);
    });

    app.get('/rest/gmail/token', function(req, res) {
        var code = req.query.code;
        console.log(code);
        res.send(code);
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