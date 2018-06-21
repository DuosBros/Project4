'use strict'

var medPharmaController = angular.module('medPharmaController');

medPharmaController.controller('notExistsNotificationController',
    ['$scope', '$modal',
    function($scope, $modal) {

    $scope.close = function() {
        this.$hide();
    }

}]);