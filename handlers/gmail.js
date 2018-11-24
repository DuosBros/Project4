

var Q = require('q');

var gmailAddress;
var gmailUserId;
var gmailSecret;

var gmailApi;
var gmailMessages;

var rp = require('request-promise');

Handler = function(app) {
    gmailAddress = app.get('gmail-address');
    gmailClientId = app.get('gmail-client-id');
    gmailSecret = app.get('gmail-secret');
    gmailApi = app.get('gmail-api');
    gmailMessages = app.get('gmail-messages');
};

Handler.prototype.getEmails = function() {
    var deferred = Q.defer();

    console.log('emailzzz');

    var uri = gmailApi + gmailAddress + gmailMessages;
    console.log(uri);

    var options = {
        method: 'GET',
        uri: uri
    };

    rp(options)
    .then(function(response) {
        console.log('fk')
        console.log(response);
        deferred.resolve(response.data);
    })
    .catch(function(err) {
        console.log('error fetching emails > ' + err);
        deferred.reject(err.message);
    });

    deferred.resolve();

    return deferred.promise;
}

Handler.prototype.sendEmail = function(email) {
    var deferred = Q.defer();

    console.log(email);
    console.log(gmailAddress);
    console.log(gmailUserId);
    console.log(gmailSecret);

    deferred.resolve();

    return deferred.promise;
}

exports.Handler = Handler;