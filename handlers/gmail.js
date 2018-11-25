

var Q = require('q');
var {google} = require('googleapis');

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var gmail = google.gmail('v1');
var readline = require('readline');

var gmailAddress;
var gmailUserId;
var gmailSecret;

var gmailApi;
var gmailMessages;

var rp = require('request-promise');

const SCOPES = ['https://mail.google.com/'];

Handler = function(app) {
    gmailAddress = app.get('gmail-address');
    gmailClientId = app.get('gmail-client-id');
    gmailSecret = app.get('gmail-secret');
    gmailApi = app.get('gmail-api');
    gmailMessages = app.get('gmail-messages');
};

Handler.prototype.auth = function() {
    var deferred = Q.defer();

    

    return deferred.promise;
}

Handler.prototype.getEmails = function() {
    var deferred = Q.defer();

    var OAuth2 = google.auth.OAuth2;

    //var oauth2Client = new OAuth2(gmailClientId, gmailSecret, 'http://localhost:3000/rest/gmail/auth');
    var oauth2Client = new OAuth2(gmailClientId, gmailSecret, 'https://medpharmavn.herokuapp.com/rest/gmail/auth');

    var authUrl = oauth2Client.generateAuthUrl({access_type: 'offline', scope: SCOPES});
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
          if (err) {
            console.log('Error while trying to retrieve access token', err);
            return;
          }
          oauth2Client.credentials = token;
          storeToken(token);
          callback(oauth2Client);
        });
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