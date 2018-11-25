

var Q = require('q');
var {google} = require('googleapis');

var gmail = google.gmail('v1');
var readline = require('readline');

var gmailAddress;
var gmailUserId;
var gmailSecret;
var gmailRedirect;

var handler;

const SCOPES = ['https://mail.google.com/'];

Handler = function(app) {
    gmailAddress = app.get('gmail-address');
    gmailClientId = app.get('gmail-client-id');
    gmailSecret = app.get('gmail-secret');
    gmailApi = app.get('gmail-api');
    gmailMessages = app.get('gmail-messages');
    gmailRedirect = app.get('gmail-redirect-uri');

    handler = this;
};

Handler.prototype.getEmails = function() {
    var deferred = Q.defer();

    var OAuth2 = google.auth.OAuth2;
    var oauth2Client = new OAuth2(gmailClientId, gmailSecret, gmailRedirect);

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

          gmail.users.messages.list({auth: oauth2Client, userId: 'me'}, function(err, response) {
            if (err) {
              console.log('The API returned an error: ' + err);
              return;
            }
            var messages = response.data.messages;
            var mId = messages[0].id;

            handler.getEmail(mId, oauth2Client)
            .then(function(email) {
                console.log(email);
            })
            .catch(function(err) {
                console.log(err);
            })

            // for (var i = 0; i < messages.length; i++) {
            //     var message = messages[i].id;
            //     console.log('%s', JSON.stringify(message));
            // }
          });
        });
    });

    return deferred.promise;
}

Handler.prototype.getEmail = function(id, oauth2Client) {
    var deferred = Q.defer();

    gmail.users.messages.get({auth: oauth2Client, userId: 'me', id}, function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
        }
        var email = response.data;
        console.log(JSON.stringify(email));
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