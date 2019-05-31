
'use strict'

var myApp = angular.module('medPharmaController');

myApp.controller('warehouseController', ['$scope', 'medPharmaOthers', 'medPharmaWarehouse', '$modal', '$q', 'medPharmaNotifications',
	function($scope, medPharmaOthers, medPharmaWarehouse, $modal, $q, medPharmaNotifications) {
		$scope.isMobile = medPharmaOthers.isMobile();

        $scope.openEditModal = function(productName) {

            var $modalScope = $scope.$new(true);
            $modalScope.productName = productName;
            $modalScope.productInfo = {
                oldValue: $scope.mappedProductsCounts[productName].total - $scope.productSales[productName].paid,
                newValue: $scope.mappedProductsCounts[productName].total - $scope.productSales[productName].paid,
                notificationThreshold: $scope.mappedProductsCounts[productName].notificationThreshold
            };
            var modal = $modal({
                            scope: $modalScope,
                            templateUrl: 'partials/modals/editProductAmount.html',
                            show: false
                        });
            modal.$promise.then(modal.show);

            $modalScope.editAmount = function() {
                medPharmaWarehouse.editProductAmount(productName,
                    $modalScope.productInfo.newValue - $modalScope.productInfo.oldValue,
                    $scope.loggedUser,
                    $modalScope.productInfo.notificationThreshold
                )
                .then(function() {
                    reloadAllProductAmounts();
                    modal.$promise.then(modal.hide);
                });
            }

            $modalScope.close = function() {
                this.$hide();
            }
        }

        $scope.openConfigureProductModal = function(productName) {
            var $modalScope = $scope.$new(true);
            $modalScope.originalName = productName;
            $modalScope.product = {
                name: productName,
                price: $scope.products[productName].price,
                weight: $scope.products[productName].weight,
                tax: $scope.products[productName].tax,
                category: $scope.products[productName].category
            }
            var modal = $modal({
                            scope: $modalScope,
                            templateUrl: 'partials/modals/editProductConfig.html',
                            show: false
                        });
            modal.$promise.then(modal.show);

            $modalScope.edit = function() {
                medPharmaWarehouse.editProductConfig($modalScope.originalName,$modalScope.product.name,
                                                     $modalScope.product.price,
                                                     $modalScope.product.weight,
                                                     $modalScope.product.tax,
                                                     $modalScope.product.category)
                .then(function() {
                    loadAllProducts();
                    reloadAllProductAmounts();
                    modal.$promise.then(modal.hide);
                })
            }

            $modalScope.close = function() {
                this.$hide();
            }
        }

        $scope.openAddProductModal = function() {
            var $modalScope = $scope.$new(true);

            $modalScope.product = {name: '', price: undefined, weight: undefined};
            var modal = $modal({
                            scope: $modalScope,
                            templateUrl: 'partials/modals/addNewProduct.html',
                            show: false
                        });
            modal.$promise.then(modal.show);

            $modalScope.add = function() {
                medPharmaWarehouse.addNewProduct($modalScope.product)
                .then(function(res) {
                    loadAllProducts();
                    reloadAllProductAmounts();
                    modal.$promise.then(modal.hide);
                })
                .catch(function(err) {
                    alert(JSON.stringify(err));
                })
            }

            $modalScope.close = function() {
                this.$hide();
            }
        }

        $scope.openAddModal = function(productName) {

            var $modalScope = $scope.$new(true);
            $modalScope.productName = productName;
            $modalScope.productInfo = {
                oldValue: $scope.mappedProductsCounts[productName].total - $scope.productSales[productName].paid,
                newValue: 0
            };
            var modal = $modal({
                            scope: $modalScope,
                            templateUrl: 'partials/modals/addProducts.html',
                            show: false
                        });
            modal.$promise.then(modal.show);

            $modalScope.editAmount = function() {
                medPharmaWarehouse.editProductAmount(productName,
                    $modalScope.productInfo.newValue,
                    $scope.loggedUser,
                    $modalScope.productInfo.notificationThreshold,
                )
                .then(function() {
                    reloadAllProductAmounts();
                    loadNotifications();
                    modal.$promise.then(modal.hide);
                });
            }

            $modalScope.close = function() {
                this.$hide();
            }
        }

        $scope.openHistoryModal = function(productName) {

            var $modalScope = $scope.$new(true);
            $modalScope.productName = productName;
            var modal = $modal({
                            scope: $modalScope,
                            templateUrl: 'partials/modals/warehouseProductHistory.html',
                            show: false
                        });
            modal.$promise.then(modal.show);

            medPharmaWarehouse.getSingleProductDataFromDB(productName)
            .then(function(singleProductData) {
                $modalScope.productWarehouseHistory = singleProductData.history;
            })

            $modalScope.close = function() {
                this.$hide();
            }
        }

        $scope.removeProduct = function(productName) {

            var $modalScope = $scope.$new(true);
            $modalScope.productName = productName;
            var modal = $modal({
                            scope: $modalScope,
                            templateUrl: 'partials/modals/confirmDelete.html',
                            show: false
                        });
            modal.$promise.then(modal.show);

            $modalScope.confirm = function() {
                medPharmaWarehouse.removeProduct(productName)
                .then(function(res) {
                    loadAllProducts();
                    reloadAllProductAmounts();
                    modal.$promise.then(modal.hide);
                })
                .catch(function(err) {
                    alert(JSON.stringify(err));
                })
            }

            $modalScope.close = function() {
                this.$hide();
            }
        }

        $scope.showNotification = function(productName) {
            for (var i = 0; i < $scope.notifications.length; i++) {
                var notification = $scope.notifications[i];
                if (notification.product == productName) {
                    return 'bg-danger';
                }
            }

            return '';
        }

        function loadNotifications() {
            medPharmaNotifications.getWarehouseNotifications()
            .then(function(notifications) {
                $scope.notifications = notifications;
            })
        }

        function loadAllProducts() {
            medPharmaOthers.getAllProductsJson()
            .then(function(products) {
                $scope.products = products;
                var productNames = Object.keys(products);
                var promises = [];
                productNames.forEach(function(productName) {
                    promises.push(medPharmaWarehouse.calculateProductsSales(productName));
                })
                return $q.all(promises);
            })
            .then(function(promiseResults) {
                $scope.productSales = promiseResults.reduce(function(mappedData, obj) {
                    var objKeys = Object.keys(obj);
                    mappedData[objKeys[0]] = obj[objKeys[0]];
                    return mappedData;
                }, {});
            })
        }

        function reloadAllProductAmounts() {
            medPharmaOthers.getAllProductsJson()
            .then(function(products) {
                $scope.allProductNames = Object.keys(products);
                return medPharmaWarehouse.getProductsDataFromDB();
            })
            .then(function(databaseProductsData) {
                return medPharmaWarehouse.mapProductNamesToAmountsPromise($scope.allProductNames, databaseProductsData);
            })
            .then(function(mappedProductsCountsFromPromise) {
                $scope.mappedProductsCounts = mappedProductsCountsFromPromise;

                $scope.productsCountArray = [];

                for (var key in $scope.mappedProductsCounts) {
                    if ($scope.mappedProductsCounts.hasOwnProperty(key)) {
                        var item = {
                            name: key,
                            total: $scope.mappedProductsCounts[key].total,
                        }
                        $scope.productsCountArray.push(item);
                    }
                }
            });
        }

        if(!medPharmaOthers.getLoggedInUser()) {
            medPharmaOthers.redirectToLoginPage();
        } else {
            $scope.loggedUser = medPharmaOthers.getLoggedInUser();
            loadAllProducts();
            reloadAllProductAmounts();
            loadNotifications();
        }
}]);