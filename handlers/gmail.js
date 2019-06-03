

var Q = require('q');
var rp = require('request-promise');
var base64url = require('base64url');

Handler = function(app) {
    mongo = app.get('mongodb');

    BASE_URL = app.get('gmail-base-uri');
    handler = this;
};

Handler.prototype.sendEmail = function(email) {
    var deferred = Q.defer();

    this.getToken()
    .then(function(token) {
        var headers = {
            'Authorization': 'Bearer ' + token
        }

        var uri = BASE_URL + 'messages/send';

        console.log(email);
        var base64EncodedEmail = base64url(email);

        var data = {
            raw: base64EncodedEmail
        }

        var options = {
            method: 'POST',
            uri: uri,
            headers: headers,
            body: data,
            json: true
        };


        console.log(options);

        rp(options)
        .then(function(response) {
            deferred.resolve(response);
        })
        .catch(function(err) {
            console.log('error sending email > ' + err.message);
            deferred.reject(err.message);
        })
    })
    .catch(function(err) {
        console.log('error sending email > ' + err.message);
        deferred.reject(err.message);
    })

    return deferred.promise;
}

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
        deferred.reject(err.message);
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

Handler.prototype.getEmails = function(pageToken) {
    var deferred = Q.defer();

    var token;
    var nextPageToken;
    this.getToken()
    .then(function(token) {
        token = token;
        var headers = {
            'Authorization': 'Bearer ' + token
        }

        var uri = BASE_URL + 'messages';
        if (pageToken) {
            uri += '?pageToken=' + pageToken
        }

        var options = {
            uri: uri,
            headers: headers,
            json: true
        };

        rp(options)
        .then(function(response) {
            var ids = response.messages;
            nextPageToken = response.nextPageToken;

            var emailPromises = [];
            for (var i = 0; i < ids.length; i++) {
                emailPromises.push(handler.getEmail(ids[i].id, token));
            }

            return Q.all(emailPromises);
        })
        .then(function(emailsResponse) {
            var data = {
                nextPageToken: nextPageToken,
                emails: []
            };

            for (var i = 0; i < emailsResponse.length; i++) {
                var emailResponse = emailsResponse[i];
                var email = {
                    date: new Date(parseInt(emailResponse.internalDate)),
                    snippet: emailResponse.snippet,
                    subject: getEmailHeader("Subject", emailResponse.payload.headers),
                    from: getEmailHeader("From", emailResponse.payload.headers),
                    to: getEmailHeader("To", emailResponse.payload.headers),
                    body: emailResponse.payload.parts
                }
                data.emails.push(email);
                // emails.push(emailResponse);

                // console.log(emailsResponse[i]);
            }

            deferred.resolve(data);
        })
        .catch(function(err) {
            console.log('error fetching emails > ' + err.message);
            deferred.reject(err.message);
        })
    })
    .catch(function(err) {
        console.log('error fetching emails > ' + err.message);
        deferred.reject(err.message);
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
                    var expiryDate = new Date(res.expiry_date);
                    var currentDate = new Date();

                    if (expiryDate > currentDate) {
                        deferred.resolve(true);
                    } else {
                        deferred.resolve(false);
                    }
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
