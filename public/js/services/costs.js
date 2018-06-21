'use strict'

var medPharmaServices = angular.module('medPharmaServices');

medPharmaServices.factory('medPharmaCosts', ['$http', '$q', '$cookies', 'medPharmaUtilities',
    function($http, $q, $cookies, medPharmaUtilities) {

    var medPharmaCosts = {};

    medPharmaCosts.getAllCosts = function() {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        $http({
            method : 'GET',
            url : '/rest/costs',
            headers: requestHeaders,
            cache : false,
            })
            .then(function(costs) {
                deferred.resolve(costs.data);
            },
            function(err) {
                deferred.reject(err);
            });
        return deferred.promise;
    };

    medPharmaCosts.deleteCost = function(costId) {
        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        return $http({
            method : 'DELETE',
            url : '/rest/costs/' + costId,
            headers: requestHeaders,
            cache : false,
        });
    };

    medPharmaCosts.saveCost = function(costId, cost) {
        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        return $http({
            method : 'PUT',
            url : '/rest/costs/' + costId,
            headers: requestHeaders,
            data : cost,
            cache : false,
        });
    };

    medPharmaCosts.addCost = function(order) {
        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        return $http({
            method : 'POST',
            url : '/rest/costs',
            headers: requestHeaders,
            data : order,
            cache : false,
        });
    };

    medPharmaCosts.getCost = function(costId) {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        $http({
            method : 'GET',
            url : '/rest/costs/' + costId,
            headers: requestHeaders,
            cache : false,
            })
            .then(function(cost) {
                deferred.resolve(cost.data);
            },
            function(err) {
                deferred.reject(err);
            });
        return deferred.promise;
    };

    return medPharmaCosts;
}]);