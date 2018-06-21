
var MongoClient = require('mongodb').MongoClient;
var json2xls = require('json2xls');
const fs = require('fs');

var dbUrl = 'mongodb://localhost:27017/medpharma';

var dayFrom = 14; //1-31
var monthFrom = 0;//0-11
var yearFrom = 2017;

var dayTo = 17; //1-31
var monthTo = 0; //0-11
var yearTo = 2017;



var firstName = 'Marie';
var lastName = 'Vilkusova';
var street = 'Severní';
var city = 'Hlučín';
var zip = '74801';
var streetNumber = '1';
var phone = '776305461';
//--------------------------------------------------------------------



var dateFrom = new Date(yearFrom, monthFrom, dayFrom);
var dateTo = new Date(yearTo, monthTo, dayTo);

var dateFromString = dateFrom.getDate() + '.' + (dateFrom.getMonth() + 1) + '.' + dateFrom.getFullYear();
var dateToString = dateTo.getDate() + '.' + (dateTo.getMonth() + 1) + '.' + dateTo.getFullYear();
var joinedDatesString = 'VSLess_' + dateFromString + '-' + dateToString;

require('isomorphic-fetch')
var Dropbox = require('dropbox').Dropbox;
var dbx;
dbx = new Dropbox({ accessToken: 'iNhg1bcaxL8AAAAAAAA_dvTV7NT4-RpKmAXlm9ef1YnBCl7mX548dzjk2aHIi9Hp' });


var queryOrders = {
    'payment.orderDate': {'$gt': dateFrom, '$lt': dateTo},
    'payment.paymentDate': { $ne: undefined},
    'state': 'active',
    'payment.vs': undefined
}

console.log();
console.log('From: ' + dateFrom);
console.log('To: ' + dateTo);
console.log();

MongoClient.connect(dbUrl, {}, function(err, db) {
    if (err) {
        console.log("Cannot connect to MongoDB at " + dbUrl);
        throw err;
    }
    console.log("MongoDB connected at " + dbUrl);

    var path = '/data exports/' + joinedDatesString;

    var orders = db.collection('orders');


    var options = {
        "sort": ["payment.vs", 'ascending']
    };

    var newVS = 0;
    orders.find({'state': 'active'}, options).toArray(function(err, order) {
        if(err) {
            console.log('ERROR while getting next VS> ' + err);
        } else {
            newVS = parseInt(order[order.length - 1].payment.vs) + 1;

            orders.find(queryOrders)
            .toArray(function(err, result) {
                if(err) {
                    console.log('ERROR while exporting orders> ' + err);
                    db.close();
                } else {
                    console.log('Number of exported Orders: ' + result.length);
                    console.log('New VS: ' + newVS);
                    var maxProductCount = 0;
                    for(var i = 0; i < result.length; i++) {
                        if(maxProductCount < result[i].products.length) {
                            maxProductCount = result[i].products.length;
                        }
                    }

                    var formattedOrders = [];

                    for(var i = 0; i < result.length; i++) {
                        (function(i) {
                            var formattedOrder = {};
                            formattedOrder.firstName = result[i].address.firstName;
                            formattedOrder.lastName = result[i].address.lastName;
                            formattedOrder.phone = result[i].address.phone;
                            formattedOrder.company = result[i].address.company;
                            formattedOrder.totalPrice = result[i].totalPrice;
                            formattedOrder.orderDate = result[i].payment.orderDate.getDate() + '.' + (result[i].payment.orderDate.getMonth() + 1) + '.' + result[i].payment.orderDate.getFullYear();
                            formattedOrder.paymentDate = result[i].payment.paymentDate.getDate() + '.' + (result[i].payment.paymentDate.getMonth() + 1) + '.' + result[i].payment.paymentDate.getFullYear();

                            for(var j = 0; j < maxProductCount; j++) {
                                formattedOrder['product' + (j + 1)] = '';
                                formattedOrder['product' + (j + 1) + ' count'] = '';
                            }
                            for(var j = 0; j < result[i].products.length; j++) {
                                formattedOrder['product' + (j + 1)] = result[i].products[j].productName;
                                formattedOrder['product' + (j + 1) + ' count'] = result[i].products[j].count;
                            }
                            formattedOrders.push(formattedOrder);

                            console.log('trying to update order with ID: ' + result[i].id);
                            orders.update({'id': result[i].id},
                                {
                                    $set:
                                    {
                                        'address.firstName': firstName,
                                        'address.lastName': lastName,
                                        'address.phone': phone,
                                        'address.street': street,
                                        'address.city': city,
                                        'address.streetNumber': streetNumber,
                                        'address.psc': zip,
                                        'address.company': '',
                                        'payment.vs': newVS,
                                        'deliveryType': 'VS'
                                    }
                                },
                                function(err, updateResult) {
                                    console.log('updated order with ID: ' + result[i].id);
                                }
                            )
                        })(i)
                    }

                    var xls = json2xls(formattedOrders);

                    fs.writeFileSync('exports/' + joinedDatesString + '-orders.xlsx', xls, 'binary');

                    fs.readFile('exports/' + joinedDatesString + '-orders.xlsx', function read(err, data) {
                        if (err) {
                            throw err;
                        }
                        var orders = data;

                        dbx.filesUpload({path: path + '/orders.xlsx', contents: orders, mode: 'overwrite'})
                        .then(function() {
                            db.close();
                        })
                        .catch(function(error) {
                            console.log('error while uploading document to dropbox: ' + error);
                            db.close();
                        });
                    });
                }
            });
        }
    });
});