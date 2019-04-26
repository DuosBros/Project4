
var MongoClient = require('mongodb').MongoClient;
//var dbUrl = 'mongodb://medpharma2:TranMedGroup12e@ds153890.mlab.com:53890/heroku_gvlqrgxg'; //prod
//var dbUrl = 'mongodb://medpharma2:TranMedGroup12e@ds137483.mlab.com:37483/heroku_q57klscp'; //test

var dbUrl = 'mongodb://localhost:27017/medpharma';

MongoClient.connect(dbUrl, {}, function (err, db) {
    if (err) {
        console.log('Cannot connect to MongoDB at ' + dbUrl);
        throw err;
    }
    console.log('MongoDB connected at ' + dbUrl);

    var productsCollection = db.collection('products');
    var warehouseCollection = db.collection('warehouse');
    var productsV2Collection = db.collection('productsV2');

    warehouseCollection.find()
        .toArray(function (err, warehouse) {
            productsCollection.find()
            .toArray(function(err, products) {
                for (var i = 0; i < products.length; i++) {
                    var product = products[i];
                    var matchedWh;
                    for (var j = 0; j < warehouse.length; j++) {
                        if (warehouse[j].productName === product.name) {
                            matchedWh = warehouse[j];
                        }
                    }
                    var newProduct;
                    if (matchedWh) {
                        newProduct = product;
                        newProduct.warehouse = {
                            amount: matchedWh.amount,
                            calculationDate: matchedWh.calculationDate,
                            history: matchedWh.history,
                        }

                        productsV2Collection.insertOne(newProduct, function(err, doc) {
                            if(err) {
                                console.log('ERROR while adding new product> ' + err);
                                db.close();
                            } else {
                                db.close();
                            }
                        });
                    }
                }
            });
        });
})