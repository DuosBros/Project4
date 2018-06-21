
var Q = require('q');

var MongoClient = require('mongodb').MongoClient;
var dbUrl = 'mongodb://localhost:27017/medpharma';

var Handler = require('../handlers/pdfGeneration.js').Handler;

var VS = 1746;

MongoClient.connect(dbUrl, {}, function(err, db) {
    if (err) {
        console.log('Cannot connect to MongoDB at ' + dbUrl);
        throw err;
    }
    console.log('MongoDB connected at ' + dbUrl);

    var orders = db.collection('orders');
    var products = db.collection('products');

    products.find()
    .toArray(function(err, allProducts) {
        var productsObject = {};

        allProducts.forEach(function(product) {
            productsObject[product.name] = {
                price: product.price,
                weight: product.weight,
                tax: product.tax
            }
        });

        var handler = new Handler(undefined, undefined);

        var match = {'state': 'active', 'payment.vs': VS};

        orders.find(match)
        .toArray(function(err, orders) {
            if(err) {
                console.log('ERROR while getting orders by VS> ' + err);
                db.close();
            } else {
                var promises = [];
                var index = 0;
                orders.forEach(function(order) {
                    console.log('Exported order number ' + order.id);
                    promises.push(handler.generatePdf(order, index, productsObject));
                    ++index;
                })

                Q.all(promises)
                .then(function() {
                    db.close();
                })
                .catch(function() {
                    db.close();
                });
            }
        });

    });


});