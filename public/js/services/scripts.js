'use strict'

var medPharmaServices = angular.module('medPharmaServices');

medPharmaServices.factory('medPharmaScripts', ['$http', '$q', 'medPharmaUtilities',
    function($http, $q, medPharmaUtilities) {

        var medPharmaScripts = {};

        medPharmaScripts.exportByVs = function(vs) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'GET',
                url : '/rest/scripts/vs/' + vs,
                headers: requestHeaders,
                cache : false,
                })
                .then(function() {
                    deferred.resolve();
                },
                function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        };

        medPharmaScripts.exportData = function(data) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'POST',
                url : '/rest/scripts/export',
                headers: requestHeaders,
                cache : false,
                data: data
                })
                .then(function() {
                    deferred.resolve();
                },
                function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        }

        medPharmaScripts.expireOrders = function(data) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'POST',
                url : '/rest/scripts/expire',
                headers: requestHeaders,
                cache : false,
                data: data
                })
                .then(function() {
                    deferred.resolve();
                },
                function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        }

        medPharmaScripts.exportNoVsData = function(data) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'POST',
                url : '/rest/scripts/exportNoVs',
                headers: requestHeaders,
                cache : false,
                data: data
                })
                .then(function() {
                    deferred.resolve();
                },
                function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        }

        medPharmaScripts.addUser = function(data) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'POST',
                url : '/rest/scripts/addUser',
                headers: requestHeaders,
                cache : false,
                data: data
                })
                .then(function() {
                    deferred.resolve();
                },
                function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        }

        medPharmaScripts.addSender = function(data) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'POST',
                url : '/rest/scripts/addSender',
                headers: requestHeaders,
                cache : false,
                data: data
                })
                .then(function() {
                    console.log('SUCCESSSSSS')
                    deferred.resolve();
                },
                function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        }

        return medPharmaScripts;
}]);