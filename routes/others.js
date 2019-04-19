module.exports = function(app) {

    var Handler = require('../handlers/others.js').Handler;
    var handler = new Handler(app);
    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);
    var tools = require('../tools/tools.js');

    var ExpressBrute = require('express-brute');

    var store = new ExpressBrute.MemoryStore();
    var bruteforce = new ExpressBrute(store);

    app.post('/rest/authenticate', bruteforce.prevent, function(req, res) {
        var username = req.body.username;
        var password = req.body.password;
        handler.authenticate(username, password)
        .then(function(token) {
            res.json(token);
            res.end();
        })
        .fail(function(err) {
            res.status(403).send({message: err});
        })
    });

    app.get('/rest/validateToken', function(req, res) {
        var token = tools.extractToken(req);
        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                res.json();
                res.end();
            })
            .fail(function(err) {
                tools.replyError(err, res);
            })
        } else {
            res.status(403).send({message: 'relog required'});
        }
    });

    app.post('/report-violation', function (req, res) {
        if (req.body) {
            console.log('CSP Violation: ', req.body)
        } else {
            console.log('CSP Violation: No data received!')
        }

        res.status(204).end()
    })

    app.get('/rest/config/senders', function(req, res) {
        var token = tools.extractToken(req);

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getAllSenders()
            })
            .then(function(senders) {
                res.json(senders);
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

    app.post('/rest/smartform', function (req, res) {
        var token = tools.extractToken(req);
        var body = req.body;

        if (token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.smartform(body);
            })
            .then(function(resp) {
                res.json(resp);
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