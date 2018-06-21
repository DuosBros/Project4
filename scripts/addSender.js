
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var dbUrl = 'mongodb://localhost:27017/medpharma';

var id = new ObjectID();
var firstname = 'Hong';
var lastname = 'Pham Bich';
var company = 'TranMedgroup s.r.o.';
var phone_number = '+420725903173';
var street = '28. října';
var street_number = '91';
var city = 'Ostrava';
var zip = '70200';
var country = 'CZ';
var label = '28. října';

MongoClient.connect(dbUrl, {}, function(err, db) {
    if (err) {
        console.log("Cannot connect to MongoDB at " + dbUrl);
        throw err;
    }
    console.log("MongoDB connected at " + dbUrl);
    var senderToInsert = {
        id: id,
        firstname: firstname,
        lastname: lastname,
        company: company,
        phone_number: phone_number,
        street: street,
        street_number: street_number,
        city: city,
        zip: zip,
        country: country,
        label: label
    };

    var senders = db.collection('senders');
    senders.ensureIndex({ label: 1}, {unique: true}, function(err, success) {
        if(err) {
            console.log('ERROR, index  for senders was NOT ensured> ' + err);
            db.close();
        } else {
            senders.insertOne(senderToInsert, function(err, doc) {
                if(err) {
                    console.log('ERROR while adding new sender (adding to DB)> ' + err);
                    db.close();
                } else {
                    console.log('Sender with company name "' + company + '" was successfully added');
                    db.close();
                }
            });
        }
    });

});