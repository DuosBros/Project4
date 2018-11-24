

var Q = require('q');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

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

Handler.prototype.auth = function() {
    var deferred = Q.defer();

    passport.use(new GoogleStrategy({
            clientID: gmailClientId
            , clientSecret: gmailSecret
            , userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
            , callbackURL: 'https://localhost:3000/rest/gmail/auth'
        }
        , function(accessToken, refreshToken, profile, done) {
            console.log('DEVKA');
            console.log(accessToken);
        }
    ));

    rp(options)
    .then(function(resp) {
        console.log(resp);
        deferred.resolve(resp);
    })
    .catch(function(err) {
        console.log(err);
        deferred.reject(err);
    });

    return deferred.promise;
}

Handler.prototype.getEmails = function() {
    var deferred = Q.defer();

    console.log('emailzzz');

    this.auth()
    .then(function(auth) {
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

    });

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