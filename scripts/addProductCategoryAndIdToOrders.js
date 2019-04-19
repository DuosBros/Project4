
var MongoClient = require('mongodb').MongoClient;
var dbUrl = 'mongodb://medpharma2:TranMedGroup12e@ds153890.mlab.com:53890/heroku_gvlqrgxg';
//var dbUrl = 'mongodb://medpharma2:TranMedGroup12e@ds137483.mlab.com:37483/heroku_q57klscp'
//var dbUrl = 'mongodb://localhost:27017/medpharma';

MongoClient.connect(dbUrl, {}, function (err, db) {
    if (err) {
        console.log('Cannot connect to MongoDB at ' + dbUrl);
        throw err;
    }
    console.log('MongoDB connected at ' + dbUrl);

	var products = db.collection('products');
    var orders = db.collection('orders');
	var allProducts;
	products.find()
		.toArray(function(err, pica) {
			
			
			orders.find()
				.toArray(function (err, allOrders) {
					
					allOrders.forEach(function (order) {
						
						order.products.forEach(function (product) {
							var found = pica.filter(x => x.name === product.productName);
							if(!found[0]) {
								console.log("not found " + product.productName)
							}
							else {
								//console.log(found[0])
								product.id = found[0].id;
								product.category = found[0].category
							}
							
							
						})	
						//console.log(order) 
						orders.update({ 'id': order.id }, order, function (err, updateResult) {
								if (err) {
									console.log(JSON.stringify(err));
									return;
								}

								console.log('updated order: ' + order.id);
							});
					});

					db.close();
				});
				
		})
		
	
    
})