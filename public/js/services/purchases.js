'use strict'

var medPharmaServices = angular.module('medPharmaServices');

medPharmaServices.factory('medPharmaPurchases', ['$http', '$q', 'medPharmaUtilities',
    function($http, $q, medPharmaUtilities) {

    var medPharmaPurchases = {};

    medPharmaPurchases.addPurchase = function(purchase) {
        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        return $http({
            method : 'POST',
            url : '/rest/purchases',
            headers: requestHeaders,
            data : purchase,
            cache : false,
        });
    };

    medPharmaPurchases.getPurchases = function() {
        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        return $http({
            method : 'GET',
            url : '/rest/purchases',
            headers: requestHeaders,
            cache : false,
        });
    };


    return medPharmaPurchases;
}]);