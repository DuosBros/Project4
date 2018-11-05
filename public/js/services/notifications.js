'use strict'

var medPharmaServices = angular.module('medPharmaServices');

medPharmaServices.factory('medPharmaNotifications', ['$http', '$q', 'medPharmaUtilities',
    function($http, $q, medPharmaUtilities) {

    var medPharmaNotifications = {};

    medPharmaNotifications.getWarehouseNotifications = function() {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        $http({
            method : 'GET',
            url : '/rest/warehouseNotifications',
            headers: requestHeaders,
            cache : false,
            })
            .then(function(notifications) {
                deferred.resolve(notifications.data);
            },
            function(err) {
                deferred.reject(err);
            });
        return deferred.promise;
    };

    return medPharmaNotifications;
}]);