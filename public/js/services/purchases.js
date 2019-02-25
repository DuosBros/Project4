'use strict'

var medPharmaServices = angular.module('medPharmaServices');

medPharmaServices.factory('medPharmaPurchases', ['$http', '$q', 'medPharmaUtilities',
    function($http, $q, medPharmaUtilities) {

    var medPharmaPurchases = {};


    return medPharmaPurchases;
}]);