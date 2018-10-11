
var MongoClient = require('mongodb').MongoClient;
var json2xls = require('json2xls');
const fs = require('fs');

var dbUrl = 'mongodb://localhost:27017/medpharma';

var dayFrom = 3; //1-31
var monthFrom = 10;//0-11
var yearFrom = 2016;



var dayTo = 30; //1-31
var monthTo = 11; //0-11
var yearTo = 2016;


var dateFrom = new Date(yearFrom, monthFrom, dayFrom);
var dateTo = new Date(yearTo, monthTo, dayTo);

var dateFromString = dateFrom.getDate() + '.' + (dateFrom.getMonth() + 1) + '.' + dateFrom.getFullYear();
var dateToString = dateTo.getDate() + '.' + (dateTo.getMonth() + 1) + '.' + dateTo.getFullYear();
var joinedDatesString = dateFromString + '-' + dateToString;

require('isomorphic-fetch')
var Dropbox = require('dropbox').Dropbox;
var dbx;
dbx = new Dropbox({ accessToken: 'iNhg1bcaxL8AAAAAAAA_dvTV7NT4-RpKmAXlm9ef1YnBCl7mX548dzjk2aHIi9Hp' });

var queryCosts = {
    'date': {'$gt': dateFrom, '$lt': dateTo}
};

var queryOrders = {
    'payment.orderDate': {'$gt': dateFrom, '$lt': dateTo},
    'state': 'active'
}

console.log();
console.log('From: ' + dateFrom);
console.log('To: ' + dateTo);
console.log();

function closeDatabase(db, costsExported, ordersExported) {
    if(costsExported && ordersExported) {
        db.close();
    }
}

var costsExported = false;
var ordersExported = false;
MongoClient.connect(dbUrl, {}, function(err, db) {
    if (err) {
        console.log("Cannot connect to MongoDB at " + dbUrl);
        throw err;
    }
    console.log("MongoDB connected at " + dbUrl);

    var path = '/medpharma/data exports/' + joinedDatesString;

    var costs = db.collection('costs');
    costs.find(queryCosts)
    .toArray(function(err, result) {
        if(err) {
            console.log('ERROR while exporting costs> ' + err);
            costsExported = true;
            closeDatabase(db, costsExported, ordersExported);
        } else {
            costsExported= true;
            console.log('Number of exported Costs: ' + result.length);
            var formattedCosts = [];
            result.forEach(function(cost) {
                delete cost._id;
                delete cost.id;
                var formattedDate = cost.date.getDate() + '.' + (cost.date.getMonth() + 1) + '.' + cost.date.getFullYear();
                var formattedPrice = cost.cost;
                delete cost.date;
                delete cost.cost;
                cost.cost = formattedPrice;
                cost.date = formattedDate;
                cost.note = cost.note ? cost.note : '-';
                formattedCosts.push(cost);
            })
            var xls = json2xls(formattedCosts);
            fs.writeFileSync('exports/' + joinedDatesString + '-costs.xlsx', xls, 'binary');

            fs.readFile('exports/' + joinedDatesString + '-costs.xlsx', function read(err, data) {
                if (err) {
                    throw err;
                }
                var costs = data;
                dbx.filesUpload({path: path + '/costs.xlsx', contents: costs, mode: 'overwrite'})
                .then(function(response) {
                    closeDatabase(db, costsExported, ordersExported);
                })
                .catch(function(error) {
                    console.log('error while uploading document to dropbox: ' + error);
                    closeDatabase(db, costsExported, ordersExported);
                });
            });
        }
    });

    var orders = db.collection('orders');
    orders.find(queryOrders)
    .toArray(function(err, result) {
        if(err) {
            console.log('ERROR while exporting orders> ' + err);
            ordersExported = true;
            closeDatabase(db, costsExported, ordersExported);
        } else {
            console.log('Number of exported Orders: ' + result.length);
            ordersExported = true;
            var formattedOrders = [];

            result.forEach(function(order) {
                for(var i = 0; i < order.products.length; i++) {
                    var record = {};

                    record.VS = order.payment.vs;
                    if(i == 0) {
                        record.firstName = order.address.firstName;
                        record.lastName = order.address.lastName;
                        record.phone = order.address.phone;
                        record.street = order.address.street;
                        record.city = order.address.city;
                        record.streetNumber = order.address.streetNumber;
                        record.zip = order.address.psc;
                        record.company = order.address.company;
                        record.orderDate = order.payment.orderDate.getDate() + '.' + (order.payment.orderDate.getMonth() + 1) + '.' + order.payment.orderDate.getFullYear();
                        record.paymentDate = order.payment.paymentDate
                            ? order.payment.paymentDate.getDate() + '.' + (order.payment.paymentDate.getMonth() + 1) + '.' + order.payment.paymentDate.getFullYear()
                            : 'not paid';
                        record.deliveryPrice = order.payment.price;
                        record.deliveryCompany = order.deliveryCompany;
                    }

                    record.productName = order.products[i].productName;
                    record.productCount = order.products[i].count;
                    record.priceOfOneExclVAT = order.products[i].pricePerOne * 0.85;
                    record.priceOfOneInclVAT = order.products[i].pricePerOne;
                    record.totalPriceExclVAT = order.products[i].totalPricePerProduct * 0.85;
                    record.totalPriceInclVAT = order.products[i].totalPricePerProduct;

                    formattedOrders.push(record);
                }

            })
            var xls = json2xls(formattedOrders);
            fs.writeFileSync('exports/' + joinedDatesString + '-orders.xlsx', xls, 'binary');

            fs.readFile('exports/' + joinedDatesString + '-orders.xlsx', function read(err, data) {
                if (err) {
                    throw err;
                }
                var orders = data;

                dbx.filesUpload({path: path + '/orders.xlsx', contents: orders, mode: 'overwrite'})
                .then(function(response) {
                    closeDatabase(db, costsExported, ordersExported);
                })
                .catch(function(error) {
                    console.log('error while uploading document to dropbox: ' + error);
                    closeDatabase(db, costsExported, ordersExported);
                });
            });
        }
    });
});