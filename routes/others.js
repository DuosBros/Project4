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
        var username = req.query.username;
        var password = req.query.password;
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

    app.post('/rest/products', function (req, res) {
        var token = tools.extractToken(req);
        var product;

        if (token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                product = req.body;
                if (!product.name || !product.price) {
                    res.status(400).send({message: 'You must provide name and price!'});
                    res.end();
                    return;
                }
                return handler.addProduct(product);
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

    app.put('/rest/products/:productName', function (req, res) {
        var token = tools.extractToken(req);
        var newProduct;
        var oldProductName;

        if (token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                newProduct = req.body;
                oldProductName = req.params.productName;
                if (!newProduct.name || !newProduct.price || !oldProductName) {
                    res.status(400).send({message: 'You must provide name, price and old product name!'});
                    res.end();
                    return;
                }
                return handler.editProduct(oldProductName, newProduct);
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

    app.delete('/rest/products/:name', function (req, res) {
        var token = tools.extractToken(req);
        var product;

        if (token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                product = req.params.name;
                return handler.removeProduct(product);
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

    app.get('/rest/products/allProducts', function(req, res) {
        var token = tools.extractToken(req);

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getAllProductsJson()
            })
            .then(function(products) {
                res.json(products);
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
}