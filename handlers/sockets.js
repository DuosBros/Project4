
var socketIoListener;

var OthersHandler = require('../handlers/others.js').Handler;
var othersHandler;

Handler = function (app) {
    mongo = app.get('mongodb');

    othersHandler = new OthersHandler(app);

    socketIoListener = app.get('socket.io.listener');

    socketIoListener.on('connection', function(socket) {
        socket.on('refresh_products', function(data) {
            othersHandler.validateToken(data.token)
            .then(function() {
                return othersHandler.getProduct(data.productId)
            })
            .then(function(product) {
                socketIoListener.emit('products', {'product': product, 'id': data.productId});
            })
            .fail(function(err) {
                console.log(err);
            })
            .done();
        });
    });
};


exports.Handler = Handler;
