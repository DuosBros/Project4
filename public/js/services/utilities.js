'use strict'

var medPharmaServices = angular.module('medPharmaServices');

medPharmaServices.factory('medPharmaUtilities', ['$cookies', function($cookies) {

    var medPharmaUtilities = {};
    medPharmaUtilities.createAuthorizedRequestHeaders = function() {
        return {'x-access-token': $cookies.get('medPharmaJWT'), Authorization: $cookies.get('medPharmaUsername')};
    }

    return medPharmaUtilities;
}]);