

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
            var snippets = [];
            for (var i = 0; i < emailsResponse.length; i++) {
                snippets.push(emailsResponse[i].snippet);
            }

            deferred.resolve(snippets);
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

    gmail.insertOne(tokens, function(err, res) {
            if(err) {
                console.log('ERROR while saving token' + err);
                deferred.reject(err);
            } else {
                deferred.resolve(res);
            }
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
                deferred.resolve(res.expiry_date);
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
