
'use strict'

var myApp = angular.module('medPharmaController');

myApp.controller('PurchasesCtrl', ['$scope', 'medPharmaOthers',
	function($scope, medPharmaOthers) {
		$scope.isMobile = medPharmaOthers.isMobile();

}]);