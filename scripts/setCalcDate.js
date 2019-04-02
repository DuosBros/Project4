
var MongoClient = require('mongodb').MongoClient;
var dbUrl = 'mongodb://medpharma2:TranMedGroup12e@ds153890.mlab.com:53890/heroku_gvlqrgxg';

MongoClient.connect(dbUrl, {}, function (err, db) {
    if (err) {
        console.log('Cannot connect to MongoDB at ' + dbUrl);
        throw err;
    }
    console.log('MongoDB connected at ' + dbUrl);

    var warehouse = db.collection('warehouse');

    warehouse.find()
        .toArray(function (err, allProducts) {

            allProducts.forEach(function (product) {
                let productHistory = product.history;
                let oldestHistoryItem = productHistory.sort((a, b) => a.timestamp - b.timestamp)[0]
                if(oldestHistoryItem) {
                    let oldestHistoryItemTimestamp = oldestHistoryItem.timestamp
                    product.calculationDate = new Date(Date.parse(oldestHistoryItemTimestamp) - 1000).toISOString()
                    warehouse.update({ '_id': product._id }, product, function (err, updateResult) {
                        if (err) {
                            console.log(JSON.stringify(err));
                            return;
                        }

                        console.log('updated product: ' + product.productName);
                    });
                }
                else {
                    console.log('skipping product: ' + product.productName)
                }
            });

            db.close();
        });
})