
'use strict'

var myApp = angular.module('medPharmaController');

myApp.controller('SummaryCtrl', ['$scope', 'medPharmaCosts', 'medPharmaOrders', 'medPharmaOthers', 'medPharmaSummaries',
	function($scope, medPharmaCosts, medPharmaOrders, medPharmaOthers, medPharmaSummaries) {
		$scope.isMobile = medPharmaOthers.isMobile();


		if(medPharmaOthers.getLoggedInUser()) {
			medPharmaSummaries.getAggregatedOrdersAndCosts()
			.then(function(aggregatedData) {
				return medPharmaSummaries.mapDataToSummary(aggregatedData.orders, aggregatedData.costs);
			})
			.then(function(mappedData) {
				$scope.totalCosts = mappedData.totalCosts;
				$scope.totalTurnover = mappedData.totalTurnover;
				$scope.totalDeliveryCosts = mappedData.totalDeliveryCosts;
				$scope.mappedSummary = mappedData.mappedSummary;
			})
		} else {
			medPharmaOthers.redirectToLoginPage();
		}

		$scope.roundNumber = function(number) {
			return Math.round(number);
		}

		$scope.formatToThousands = function(number) {
			return number ? number.toLocaleString() : number;
		}
}]);