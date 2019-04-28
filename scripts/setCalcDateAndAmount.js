
var MongoClient = require('mongodb').MongoClient;
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

    var productsV2 = db.collection('productsV2');

    productsV2.find()
        .toArray(function (err, allProducts) {

            allProducts.forEach(function (product) {
                let productWarehouse = product.warehouse;
                let productHistory = productWarehouse.history;

                let newAmount = 0;
                productHistory.forEach(function(historyItem) {
                    if (typeof historyItem.difference == 'number') {
                        newAmount += historyItem.difference;
                    }
                });
                let oldestHistoryItem = productHistory.sort((a, b) => a.timestamp - b.timestamp)[0];

                if (oldestHistoryItem) {
                    let oldestHistoryItemTimestamp = oldestHistoryItem.timestamp;
                    productWarehouse.calculationDate = new Date(Date.parse(oldestHistoryItemTimestamp) - 1000);
                    productWarehouse.amount = newAmount;
                    product.warehouse = productWarehouse;
                    productsV2.update({ '_id': product._id }, product, function (err, updateResult) {
                        if (err) {
                            console.log(JSON.stringify(err));
                            return;
                        }

                        console.log('updated product: ' + product.name);
                    });
                }
                else {
                    console.log('skipping product: ' + product.name)
                }
            });

            db.close();
        });
})