module.exports = function(app) {

    var Handler = require('../handlers/scripts.js').Handler;
    var handler = new Handler(app);

    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);

    var tools = require('../tools/tools.js');

    app.post('/rest/scripts/expire', function(req, res) {
        var token = tools.extractToken(req);
        var variableSymbols = req.body;
        var parsedVS = [];

        for(var i = 0; i < variableSymbols.length; i++) {
            parsedVS.push(parseInt(variableSymbols[i]));
        }

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.expireOrders(parsedVS);
            })
            .then(function() {
                res.json();
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

    app.get('/rest/scripts/vs/:vs', function(req, res) {
        var token = tools.extractToken(req);
        var vs = parseInt(req.params.vs);

        if (token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.exportByVS(vs);
            })
            .then(function() {
                res.json();
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

    app.post('/rest/scripts/export', function(req, res) {
        var token = tools.extractToken(req);

        var fromDay = parseInt(req.body.fromDay);
        var fromMonth = parseInt(req.body.fromMonth) - 1;
        var fromYear = parseInt(req.body.fromYear);
        var toDay = parseInt(req.body.toDay);
        var toMonth = parseInt(req.body.toMonth) - 1;
        var toYear = parseInt(req.body.toYear);

        if (token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.export(fromDay, fromMonth, fromYear, toDay, toMonth, toYear);
            })
            .then(function() {
                res.json();
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

    app.post('/rest/scripts/exportNoVs', function(req, res) {
        var token = tools.extractToken(req);

        var fromDay = parseInt(req.body.fromDay);
        var fromMonth = parseInt(req.body.fromMonth) - 1;
        var fromYear = parseInt(req.body.fromYear);
        var toDay = parseInt(req.body.toDay);
        var toMonth = parseInt(req.body.toMonth) - 1;
        var toYear = parseInt(req.body.toYear);

        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        var street = req.body.street;
        var city = req.body.city;
        var zip = req.body.zip;
        var streetNumber = req.body.streetNumber;
        var phone = req.body.phone;

        if (token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.exportNoVs(fromDay, fromMonth, fromYear, toDay, toMonth, toYear, firstName, lastName, street, city, zip, streetNumber, phone);
            })
            .then(function() {
                res.json();
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

    app.post('/rest/scripts/addUser', function(req, res) {
        var token = tools.extractToken(req);

        var username = req.body.username;
        var password = req.body.password;

        if (token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.addUser(username, password);
            })
            .then(function() {
                res.json();
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

    app.post('/rest/scripts/addSender', function(req, res) {
        var token = tools.extractToken(req);

        var firstname = req.body.firstName;
        var lastname = req.body.lastName;
        var company = req.body.company;
        var phone_number = req.body.phoneNumber;
        var street = req.body.street;
        var street_number = req.body.streetNumber;
        var city = req.body.city;
        var zip = req.body.zip;
        var country = req.body.country;
        var label = req.body.label;

        if (token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.addSender(firstname, lastname, company, phone_number, street, street_number, city, zip, country, label);
            })
            .then(function() {
                res.json();
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