
'use strict'

var myApp = angular.module('medPharmaController');

myApp.controller('PurchasesCtrl', ['$scope', 'medPharmaOthers', 'medPharmaPurchases', '$modal',
	function($scope, medPharmaOthers, medPharmaPurchases, $modal) {
		$scope.isMobile = medPharmaOthers.isMobile();

		getAllPurchases();
		$scope.loggedInUser = medPharmaOthers.getLoggedInUser()

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

		medPharmaOthers.getAllProductsJson()
        .then(function(products) {
            $scope.allProductNames = Object.keys(products);
        });

		$scope.openAddModal = function() {
			var $modalScope = $scope.$new(true);
			$modalScope.purchase = {
				products: [{
                    productName: "",
                    count: 1
                }],
				to: 'hlasenska@medpharma.cz',
				user: $scope.loggedInUser,
			};
			$modalScope.allProductNames = $scope.allProductNames;

			var modal = $modal({
							scope: $modalScope,
							templateUrl: 'partials/modals/purchasesForm.html',
							show: false
							});
			modal.$promise.then(modal.show);

			$modalScope.addPurchase = function() {
				medPharmaPurchases.addPurchase($modalScope.purchase)
				.then(function() {
					getAllPurchases();
					modal.$promise.then(modal.hide);
				});
			}

			$modalScope.removeProduct = function(index) {
                $modalScope.purchase.products.splice(index, 1);
			}

			$modalScope.addProduct = function() {
                var lastProduct = $modalScope.purchase.products[$modalScope.purchase.products.length - 1];
                if (lastProduct.productName !== "") {
                    $modalScope.purchase.products.push({
                        productName: "",
                        count: 1
                    });
                }
            };

			$modalScope.close = function() {
				this.$hide();
			}
		}

		function getAllPurchases() {
			$scope.loading = true;
			medPharmaPurchases.getPurchases()
			.then(function(purchases) {
				$scope.purchases = purchases.data;
				console.log(purchases.data);
				$scope.loading = false;
			});
		}
}]);
