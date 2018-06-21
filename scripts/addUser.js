var passwordHash = require('password-hash');
var owasp = require('owasp-password-strength-test');
var MongoClient = require('mongodb').MongoClient;
var dbUrl = 'mongodb://localhost:27017/medpharma';


var username = 'nvxd212';
var password = '12345a.dd67B';
var passwordTestResult = owasp.test(password);
if(passwordTestResult.errors && passwordTestResult.errors.length > 0) {
    console.log(passwordTestResult.errors);
    return;
}

MongoClient.connect(dbUrl, {}, function(err, db) {
    if (err) {
        console.log("Cannot connect to MongoDB at " + dbUrl);
        throw err;
    }
    console.log("MongoDB connected at " + dbUrl);
    var userToBeInserted = {username: username, password: passwordHash.generate(password, {algorithm: 'sha256', iterations: 2})};

    var users = db.collection('users');
    users.ensureIndex({ username: 1}, {unique: true}, function(err, success) {
        if(err) {
            console.log('ERROR, index  for users was NOT ensured> ' + err);
            db.close();
        } else {
            users.insertOne(userToBeInserted, function(err, doc) {
                if(err) {
                    console.log('ERROR while creating new order (adding to DB)> ' + err);
                    db.close();
                } else {
                    console.log('User with username "' + username + '" was successfully added');
                    db.close();
                }
            });
        }
    });

});