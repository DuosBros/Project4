'use strict'

var medPharmaServices = angular.module('medPharmaServices');

medPharmaServices.factory('medPharmaCharts', ['$http', '$q', 'medPharmaUtilities',
    function($http, $q, medPharmaUtilities) {

        var medPharmaCharts = {};

        medPharmaCharts.getProductsSales = function() {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'GET',
                url : '/rest/charts/products',
                headers: requestHeaders,
                cache : false,
                })
                .then(function(products) {
                    deferred.resolve(products.data);
                },
                function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        };

        return medPharmaCharts;
}]);