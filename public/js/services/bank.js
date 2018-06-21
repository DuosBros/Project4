'use strict'

var medPharmaServices = angular.module('medPharmaServices');

medPharmaServices.factory('medPharmaBank', ['$http', '$q', 'medPharmaUtilities',
    function($http, $q, medPharmaUtilities) {

        var medPharmaBank = {};

        medPharmaBank.getAllTransactions = function() {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'GET',
                url : '/rest/bank/transactions',
                headers: requestHeaders,
                cache : false,
                })
                .then(function(transactions) {
                    deferred.resolve(transactions.data);
                },
                function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        };

        return medPharmaBank;
}]);