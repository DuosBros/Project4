module.exports = function(app) {

    var Handler = require('../handlers/charts.js').Handler;
    var handler = new Handler(app);
    var tools = require('../tools/tools.js');
    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);

    app.get('/rest/charts/products', function(req, res) {
        var token = tools.extractToken(req);
        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getAllProductsData()
            })
            .then(function(allProducts) {
                res.json(allProducts);
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