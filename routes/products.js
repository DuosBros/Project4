module.exports = function (app) {

    var Handler = require('../handlers/others.js').Handler;
    var handler = new Handler(app);
    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);
    var tools = require('../tools/tools.js');

    app.post('/rest/products', function (req, res) {
        var token = tools.extractToken(req);
        var product;

        if (token) {
            authenticationHandler.validateToken(token)
                .then(function () {
                    product = req.body;
                    if (!product.name || !product.price || !product.category) {
                        res.status(400).send({ message: 'You must provide name, price and category!' });
                        res.end();
                        return;
                    }
                    return handler.addProduct(product);
                })
                .then(function (result) {
                    res.json(result);
                    res.end();
                })
                .fail(function (err) {
                    tools.replyError(err, res);
                })
                .done();

        } else {
            res.status(403).send({ message: 'No authentication token!' });
        }
    });

    app.put('/rest/products/:productName', function (req, res) {
        var token = tools.extractToken(req);
        var newProduct;
        var oldProductName;

        if (token) {
            authenticationHandler.validateToken(token)
                .then(function () {
                    newProduct = req.body;
                    oldProductName = req.params.productName;
                    if (!newProduct.name || !newProduct.price || !oldProductName) {
                        res.status(400).send({ message: 'You must provide name, price and old product name!' });
                        res.end();
                        return;
                    }
                    return handler.editProduct(oldProductName, newProduct);
                })
                .then(function (result) {
                    res.json(result);
                    res.end();
                })
                .fail(function (err) {
                    tools.replyError(err, res);
                })
                .done();

        } else {
            res.status(403).send({ message: 'No authentication token!' });
        }
    });

    app.delete('/rest/products/:name', function (req, res) {
        var token = tools.extractToken(req);
        var product;

        if (token) {
            authenticationHandler.validateToken(token)
                .then(function () {
                    product = req.params.name;
                    return handler.removeProduct(product);
                })
                .then(function (result) {
                    res.json(result);
                    res.end();
                })
                .fail(function (err) {
                    tools.replyError(err, res);
                })
                .done();

        } else {
            res.status(403).send({ message: 'No authentication token!' });
        }
    });

    app.get('/rest/products/allProducts', function (req, res) {
        var token = tools.extractToken(req);

        if (token) {
            authenticationHandler.validateToken(token)
                .then(function () {
                    return handler.getAllProductsJson()
                })
                .then(function (products) {
                    res.json(products);
                    res.end();
                })
                .fail(function (err) {
                    tools.replyError(err, res);
                })
                .done();
        } else {
            res.status(403).send({ message: 'No authentication token!' });
        }
    });

    app.get('/rest/products/v2', function (req, res) {
        var token = tools.extractToken(req);

        if (token) {
            authenticationHandler.validateToken(token)
                .then(function () {
                    return handler.getProductsJson()
                })
                .then(function (products) {
                    res.json(products);
                    res.end();
                })
                .fail(function (err) {
                    tools.replyError(err, res);
                })
                .done();
        } else {
            res.status(403).send({ message: 'No authentication token!' });
        }
    });

    app.get('/rest/products/v2/:id', function (req, res) {
        var token = tools.extractToken(req);
        var productId = req.params.id;

        if (token) {
            authenticationHandler.validateToken(token)
                .then(function () {
                    return handler.getProduct(productId)
                })
                .then(function (products) {
                    res.json(products);
                    res.end();
                })
                .fail(function (err) {
                    tools.replyError(err, res);
                })
                .done();
        } else {
            res.status(403).send({ message: 'No authentication token!' });
        }
    });

    app.put('/rest/products/v2/:id', function (req, res) {
        var token = tools.extractToken(req);
        var productId = req.params.id;
        var product = req.body;

        if (token) {
            authenticationHandler.validateToken(token)
                .then(function () {
                    return handler.saveProduct(productId, product)
                })
                .then(function (editedProducts) {
                    res.json(editedProducts);
                    res.end();
                })
                .fail(function (err) {
                    tools.replyError(err, res);
                })
                .done();
        } else {
            res.status(403).send({ message: 'No authentication token!' });
        }
    });

    app.delete('/rest/products/v2/:id', function (req, res) {
        console.log("here")
        var token = tools.extractToken(req);
        var productId = req.params.id;

        if (token) {
            authenticationHandler.validateToken(token)
                .then(function () {
                    return handler.deleteProduct(productId)
                })
                .then(function (status) {
                    res.json(status);
                    res.end();
                })
                .fail(function (err) {
                    tools.replyError(err, res);
                })
                .done();
        } else {
            res.status(403).send({ message: 'No authentication token!' });
        }
    });
}
