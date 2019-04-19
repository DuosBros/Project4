
var MongoClient = require('mongodb').MongoClient;
//var dbUrl = 'mongodb://medpharma2:TranMedGroup12e@ds153890.mlab.com:53890/heroku_gvlqrgxg';
//var dbUrl = 'mongodb://medpharma2:TranMedGroup12e@ds137483.mlab.com:37483/heroku_q57klscp'
var dbUrl = 'mongodb://localhost:27017/medpharma';

MongoClient.connect(dbUrl, {}, function (err, db) {
    if (err) {
        console.log('Cannot connect to MongoDB at ' + dbUrl);
        throw err;
    }
    console.log('MongoDB connected at ' + dbUrl);

    var products = db.collection('productsV2');
	
	
    products.find()
        .toArray(function (err, allProducts) {
			var index = 1
            allProducts.forEach(function (product) {
				console.log(product.name +": " +product.id)
				//product.id = index;
				//index++
				
				// products.update({ '_id': product._id }, product, function (err, updateResult) {
                        // if (err) {
                            // console.log(JSON.stringify(err));
                            // return;
                        // }

                        // console.log('updated product: ' + product.name);
                    // });
            });

            db.close();
        });
})