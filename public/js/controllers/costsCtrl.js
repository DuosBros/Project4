
'use strict'

var myApp = angular.module('medPharmaController');

myApp.controller('CostsCtrl', ['$scope', '$modal', 'medPharmaCosts', 'medPharmaOthers',
    function($scope, $modal, medPharmaCosts, medPharmaOthers) {
    $scope.isMobile = medPharmaOthers.isMobile();
    if(medPharmaOthers.getLoggedInUser()) {
        getAllCosts();
    } else {
        medPharmaOthers.redirectToLoginPage();
    }

    $scope.openAddModal = function() {

        var $modalScope = $scope.$new(true);
        $modalScope.cost = {};
        $modalScope.cost.date = new Date();
        var modal = $modal({
                        scope: $modalScope,
                        templateUrl: 'partials/modals/costsForm.html',
                        show: false
                        });
        modal.$promise.then(modal.show);

        $modalScope.addCost = function() {
            medPharmaCosts.addCost($modalScope.cost)
            .then(function(order) {
                getAllCosts();
                modal.$promise.then(modal.hide);
            });
        }

        $modalScope.close = function() {
        	this.$hide();
    	}
   	}

    $scope.editCost = function(costId) {
        medPharmaCosts.getCost(costId)
        .then(function(cost) {
            if(!medPharmaOthers.validateItemExists(cost, $scope)) {

            } else {
                var $modalScope = $scope.$new(true);
                $modalScope.cost = cost;
                $modalScope.edit = true;
                var modal = $modal({
                                scope: $modalScope,
                                templateUrl: 'partials/modals/costsForm.html',
                                show: false
                                });
                modal.$promise.then(modal.show);

                $modalScope.editCost = function() {
                    medPharmaCosts.saveCost($modalScope.cost.id, $modalScope.cost)
                    .then(function(cost) {
                        getAllCosts();
                        modal.$promise.then(modal.hide);
                    });
                }

                $modalScope.close = function() {
                    this.$hide();
                }
            }
        });
    }

    $scope.deleteCost = function(costId) {
        medPharmaCosts.getCost(costId)
        .then(function(cost) {
            if(!medPharmaOthers.validateItemExists(cost, $scope)) {

            } else {
                medPharmaCosts.deleteCost(costId)
                .then(function(res) {
                    getAllCosts();
                });
            }
        })
    }

    $scope.getBorderColor = function(currentCost, nextCost) {
        if (!nextCost) {
            return '';
        }
        var currentMonth = new Date(currentCost.date).getMonth();
        var nextMonth = new Date(nextCost.date).getMonth();

        return currentMonth === nextMonth ? 'rgba(230,230,230,1)' : 'black';
    }


    function getAllCosts() {
        medPharmaCosts.getAllCosts()
        .then(function(costs) {
            $scope.costs = costs;
        })
    }
}]);