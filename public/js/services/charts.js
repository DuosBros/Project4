'use strict'

var medPharmaServices = angular.module('medPharmaServices');

medPharmaServices.factory('medPharmaCharts', ['$http', '$q', 'medPharmaUtilities',
    function($http, $q, medPharmaUtilities) {

        var medPharmaCharts = {};

        medPharmaCharts.getProductsSales = function(from, to) {
            var deferred = $q.defer();

            var url = '/rest/charts/products';
            if (from) {
                url += '?from=' + from;
            }
            if (to) {
                if (!from) {
                    url += '?';
                } else {
                    url += '&';
                }
                url += 'to=' + to;
            }

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'GET',
                url : url,
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