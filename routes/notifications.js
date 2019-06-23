module.exports = function(app) {

    var Handler = require('../handlers/notifications').Handler;
    var handler = new Handler(app);

    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);

    var tools = require('../tools/tools.js');

    app.get('/rest/notPaidNotifications', function(req, res) {
        var token = tools.extractToken(req);

        if (token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getNotPaidNotifications()
            })
            .then(function(notifications) {
                res.json(notifications);
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
