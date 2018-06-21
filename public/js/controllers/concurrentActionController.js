'use strict'

var medPharmaController = angular.module('medPharmaController');

medPharmaController.controller('concurrentActionController',
    ['$scope', '$modal',
    function($scope, $modal) {

    $scope.close = function() {
        this.$hide();
    }

}]);