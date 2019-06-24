module.exports = function(app) {

    var Handler = require('../handlers/warehouse').Handler;
    var handler = new Handler(app);

    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);

    var tools = require('../tools/tools.js');

    app.put('/rest/warehouse/products/:filterBy', function(req, res) {
        var token = tools.extractToken(req);
        var filterBy = req.params.filterBy;
        var difference = req.body.difference;
        var user = req.body.user;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.saveProductAmount(filterBy, difference, user);
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

    app.get('/rest/warehouse/v2', function(req, res) {
        var year = parseInt(req.query.year);
        var month = parseInt(req.query.month);
        month -= 1;

        var currentDate = new Date();
        if (!year) {
            year = currentDate.getFullYear();
        }

        if (!month) {
            month = currentDate.getMonth();
        }

        handler.getWarehouseV2(year, month)
        .then(function(productsData) {
            res.json(productsData);
            res.end();
        })
        .fail(function(err) {
            tools.replyError(err, res);
        })
        .done();
    });
}
