

module.exports = function(app) {

    var SocketsHandler = require('../handlers/sockets.js').Handler;
    var socketsHandler = new SocketsHandler(app);

    app.get('*', function(req, res) {
        res.render('index.html');
    });
}