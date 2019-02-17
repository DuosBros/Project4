'use strict'

var medPharmaServices = angular.module('medPharmaServices');

medPharmaServices.factory('medPharmaGmail', ['$http', '$q', 'medPharmaUtilities',
    function($http, $q, medPharmaUtilities) {

        var medPharmaGmail = {};

        medPharmaGmail.auth = function() {
            var deferred = $q.defer();

            $http.get("/rest/gmail/auth")
            .then(function(response) {
                deferred.resolve(response.data);
            });

            return deferred.promise;
        };

        medPharmaGmail.getToken = function(code) {
            var deferred = $q.defer();

            $http.get("/rest/gmail/token?code=" + code)
            .then(function(response) {
                deferred.resolve(response.data);
            });

            return deferred.promise;
        };

        medPharmaGmail.getEmails = function(pageToken) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            var uri = '/rest/gmail/emails';
            if (pageToken) {
                uri += '?pageToken=' + pageToken;
            }

            $http({
                method : 'GET',
                url : uri,
                headers: requestHeaders,
                cache : false,
                })
                .then(function(resp) {
                    deferred.resolve(resp.data);
                },
                function(err) {
                    deferred.reject(err.data.message);
                });

            return deferred.promise;
        };

        medPharmaGmail.isLogged = function() {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'GET',
                url : '/rest/gmail/is_logged',
                headers: requestHeaders,
                cache : false,
                })
                .then(function(resp) {
                    var expiryDate = new Date(resp.data);
                    var currentDate = new Date();

                    if (expiryDate > currentDate) {
                        deferred.resolve(true);
                    } else {
                        deferred.resolve(false);
                    }
                },
                function(err) {
                    deferred.reject(err);
                });

            return deferred.promise;
        };

        return medPharmaGmail;
}]);
