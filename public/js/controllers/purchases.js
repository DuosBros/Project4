
'use strict'

var myApp = angular.module('medPharmaController');

myApp.controller('PurchasesCtrl', ['$scope', 'medPharmaOthers', 'medPharmaPurchases',
	function($scope, medPharmaOthers, medPharmaPurchases) {
		$scope.isMobile = medPharmaOthers.isMobile();

		$scope.loading = true;
		medPharmaPurchases.getPurchases()
		.then(function(purchases) {
			$scope.purchases = purchases.data;
			console.log(purchases.data);
			$scope.loading = false;
		});

		$scope.printProducts = function(products) {
			var str = '';

			for (var i = 0; i < products.length; i++) {
				var product = products[i];
				str += product.productName + ': ' + product.count;

				if (i < products.length - 1) {
					str += ', ';
				}
			}

			return str;
		}

}]);