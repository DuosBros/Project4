module.exports = function(app) {

    var Handler = require('../handlers/pdfGeneration.js').Handler;
    var handler = new Handler(app);

    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);

    var OrderHandler = require('../handlers/orders.js').Handler;
    var orderHandler = new OrderHandler(app);
    var tools = require('../tools/tools.js');

    app.get('/rest/pdf/orders/:orderId', function(req, res) {
        var orderId = req.params.orderId;
        var token = tools.extractToken(req);
        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return orderHandler.getOrder(orderId)
            })
            .then(function(order) {
                return handler.generatePdf(order)
            })
            .then(function(result) {
                res.json(result);
                res.end();
            })
            .fail(function(err) {
                console.log(JSON.stringify(err));
                tools.replyError(err, res);
            })
            .done();
        } else {
            res.status(403).send({message: 'No authentication token!'});
        }
    });
}