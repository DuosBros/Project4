

var Q = require('q');
var rp = require('request-promise');

Handler = function(app) {
    mongo = app.get('mongodb');

    BASE_URL = app.get('gmail-base-uri');
    handler = this;
};

Handler.prototype.getEmail = function(id, token) {
    var deferred = Q.defer();

    var headers = {
        'Authorization': 'Bearer ' + token
    }

    var options = {
        uri: BASE_URL + 'messages/' + id,
        headers: headers,
        json: true
    };

    rp(options)
    .then(function(response) {
        deferred.resolve(response);
    })
    .catch(function(err) {
        console.log('error fetching emails > ' + err.message);
    })

    return deferred.promise;
}

function getEmailHeader(header, headers) {
    for (var i = 0; i < headers.length; i++) {
        var h = headers[i];
        if (h.name == header) {
            return h.value;
        }
    }
}

Handler.prototype.getEmails = function() {
    var deferred = Q.defer();

    var token;
    this.getToken()
    .then(function(token) {
        token = token;
        var headers = {
            'Authorization': 'Bearer ' + token
        }

        var options = {
            uri: BASE_URL + 'messages',
            headers: headers,
            json: true
        };

        rp(options)
        .then(function(response) {
            var ids = response.messages;
            var emailPromises = [];
            for (var i = 0; i < ids.length; i++) {
                emailPromises.push(handler.getEmail(ids[i].id, token));
            }

            return Q.all(emailPromises);
        })
        .then(function(emailsResponse) {
            var emails = [];
            for (var i = 0; i < emailsResponse.length; i++) {
                var emailResponse = emailsResponse[i];
                var email = {
                    date: new Date(parseInt(emailResponse.internalDate)),
                    snippet: emailResponse.snippet,
                    subject: getEmailHeader("Subject", emailResponse.payload.headers),
                    from: getEmailHeader("From", emailResponse.payload.headers),
                    body: emailResponse.payload.parts
                }
                emails.push(email);
                // emails.push(emailResponse);

                // console.log(emailsResponse[i]);
            }

            deferred.resolve(emails);
        })
        .catch(function(err) {
            console.log('error fetching emails > ' + err.message);
            deferred.reject(err.message);
        })
    })

    return deferred.promise;
}

Handler.prototype.storeToken = function(tokens) {
    var deferred = Q.defer();
    var gmail = mongo.collection('gmail');

    gmail.remove({}, function(err, res) {
        gmail.insertOne(tokens, function(err, res) {
            if(err) {
                console.log('ERROR while saving token' + err);
                deferred.reject(err);
            } else {
                deferred.resolve(res);
            }
        });
    });

    return deferred.promise;
}

Handler.prototype.isLogged = function() {
    var deferred = Q.defer();
    var gmail = mongo.collection('gmail');

    gmail.findOne({}, function(err, res) {
            if(err) {
                console.log('ERROR while getting token' + err);
                deferred.reject(err);
            } else {
                if (res) {
                    deferred.resolve(res.expiry_date);
                } else {
                    deferred.resolve(undefined);
                }
            }
    });

    return deferred.promise;
}

Handler.prototype.getToken = function() {
    var deferred = Q.defer();
    var gmail = mongo.collection('gmail');

    gmail.findOne({}, function(err, res) {
            if(err) {
                console.log('ERROR while getting token' + err);
                deferred.reject(err);
            } else {
                deferred.resolve(res.access_token);
            }
    });

    return deferred.promise;
}

exports.Handler = Handler;
