'use strict'

var medPharmaController = angular.module('medPharmaController');
medPharmaController.controller('orderController',
    ['$scope', 'medPharmaOrders', 'medPharmaOthers', '$location', '$routeParams', '$modal', 'medPharmaZaslat',
    function($scope, medPharmaOrders, medPharmaOthers, $location, $routeParams, $modal, medPharmaZaslat) {

    $scope.isMobile = medPharmaOthers.isMobile();
    $scope.smartFormReloaded = false;
    setInterval(function(){
        if(smartform && !$scope.smartFormReloaded) {
            smartform.rebindAllForms(true);
            $scope.smartFormReloaded = true;
        }
    }, 1000);

    var socket = io.connect();

    $scope.loadAvailableProducts = function() {
        medPharmaOthers.getAllProductsJsonWithOtherValue()
        .then(function(products) {
            $scope.allProducts = products;
            $scope.productNames = Object.keys($scope.allProducts);
            $scope.createNewProductFields();
        })
    }

    $scope.mergeStreetAndStreetNumber = function(street, streetNumber) {
        var streetAndNumber = "";
        if(street) {
            streetAndNumber = streetAndNumber + street + " ";
        }
        if(streetNumber) {
            streetAndNumber = streetAndNumber + streetNumber;
        }
        return streetAndNumber;
    }

    $scope.initSelectorValue = function() {
        if($scope.order.deliveryType == 'Cash') {
            $scope.deliverySelector = 'cash';
        } else if($scope.order.deliveryType == 'VS' && $scope.order.deliveryCompany == 'GLS') {
            $scope.deliverySelector = 'vs_gls';
        } else if($scope.order.deliveryType == 'VS' && $scope.order.deliveryCompany == 'CP') {
            $scope.deliverySelector = 'vs_cp';
        }
    }

    $scope.$watch('deliverySelector', function(newVal, oldVal) {
        if((newVal == 'vs_gls' || newVal == 'vs_cp') &&
            ((oldVal != 'vs_gls' && oldVal != "vs_cp" && oldVal != undefined && !$scope.order.payment.vs))) {
            medPharmaOrders.getNextVS()
            .then(function(vs) {
                $scope.order.payment.vs = vs;
            })
        }

        if ($scope.order && newVal != 'vs_gls') {
            $scope.order.payment.price = undefined;
            $scope.calculateTotalPrice();
        }
    })

    $scope.orderId = $routeParams.id;
    $scope.edit = $scope.orderId ? true : false;
    if($scope.edit) {
        medPharmaOrders.getOrder($scope.orderId)
        .then(function(order) {
            $scope.order = order;
            $scope.deepCopyOrder = JSON.parse(JSON.stringify($scope.order));
            delete $scope.deepCopyOrder.lock;
            var str = document.getElementById('hiddenStreet');
            var strNum = document.getElementById('hiddenStreetNumber');
            str.value = order.address.street;
            strNum.value = order.address.streetNumber;
            $scope.streetAndNumber = $scope.mergeStreetAndStreetNumber($scope.order.address.street, $scope.order.address.streetNumber);
            $scope.loadAvailableProducts();
            $scope.initSelectorValue();
        });
    } else {
        $scope.order = {};
        $scope.order.address = {};
        $scope.order.products = [];
        $scope.order.totalPrice = 0;
        $scope.order.payment = {};
        $scope.order.deliveryType = 'VS';
        $scope.order.deliveryCompany = 'GLS';
        $scope.order.payment.orderDate = new Date();
        $scope.order.state = 'active';
        $scope.order.payment.cashOnDelivery = true;
        $scope.loadAvailableProducts();
        $scope.initSelectorValue();

        medPharmaOrders.getNextVS()
        .then(function(vs) {
            $scope.order.payment.vs = vs;
        })
    }

    $scope.increaseLock = true;
    $scope.user = medPharmaOthers.getLoggedInUser();


    $scope.createNewProductFields = function() {
        if(!$scope.order.products) {
            $scope.order.products = [];
        }
        $scope.order.products.push({productName: "", count: "", pricePerOne: "", totalPricePerProduct: "", collapsed: 1});
    }

    setInterval(function(){
        if($scope.increaseLock && $scope.edit) {
            medPharmaOrders.setOrderLock($scope.order.id, $scope.user, 10)
            .then(function() {
                //increasing lock by 10seconds
            })
        }
    }, 10000);

    $scope.$on('$typeahead.select', function(value, index) {
        if($scope.order.products[$scope.order.products.length - 2].productName == index) {
            $scope.order.products[$scope.order.products.length - 2].pricePerOne = $scope.allProducts[index].price;
            $scope.order.products[$scope.order.products.length - 2].count = 1;
            $scope.calculateTotalPricePerProduct($scope.order.products[$scope.order.products.length - 2]);
            $scope.calculateTotalPrice();
        }
    });

    $scope.productWatcher = function() {
        var lastProduct = $scope.order.products[$scope.order.products.length - 1];
        if(lastProduct.productName && lastProduct.productName.length > 0) {
            $scope.createNewProductFields();
        }
    }

    $scope.calculateTotalPricePerProduct = function(product) {
        product.totalPricePerProduct = product.pricePerOne * product.count;

        $scope.calculateDeliveryPrice();
    }

    $scope.calculateDeliveryPrice = function() {
        if ($scope.deliverySelector == 'vs_gls') {
            var weight = $scope.calculateTotalWeight();
            medPharmaZaslat.getRates(weight)
            .then(function(response) {
                if (response && response.price_vat) {
                    $scope.order.payment.price = Math.round(response.price_vat.value);
                } else {
                    $scope.order.payment.price = undefined;
                }
                $scope.calculateTotalPrice();
            });
        } else {
            $scope.order.payment.price = undefined;
            $scope.calculateTotalPrice();
        }
    }

    $scope.calculateTotalWeight = function() {
        var weight = 0;
        var numberOfProducts = 0;
        var productsOnOrder = $scope.order.products;

        for (var i = 0; i < productsOnOrder.length; i++) {
            var productName = productsOnOrder[i].productName;
            if (productName && productName != '' && productsOnOrder[i].count && productsOnOrder[i].count != '') {
                var productDescription = $scope.allProducts[productName];
                if (productDescription && productDescription.weight && Number.isInteger(productDescription.weight)) {
                    weight += productDescription.weight * productsOnOrder[i].count;
                    numberOfProducts += productsOnOrder[i].count;
                }
            }
        }

        if (numberOfProducts < 15) {
            weight += 200;
        } else if (numberOfProducts < 40) {
            weight += 400;
        } else {
            weight += 600;
        }

        return weight;
    }

    $scope.calculateTotalPrice = function() {
        var totalPrice = 0;

        $scope.order.products.forEach(function(product) {
            if(product.totalPricePerProduct) {
                totalPrice += parseInt(product.totalPricePerProduct);
            }
        });

        if($scope.order.payment && $scope.order.payment.price) {
            totalPrice += parseInt($scope.order.payment.price);
        }

        $scope.order.totalPrice = totalPrice;
    }

    $scope.deleteProduct = function(index, indexOfLastProduct) {
        if(!indexOfLastProduct) {
            $scope.order.products.splice(index, 1);
        }
        $scope.calculateDeliveryPrice();
    }

    $scope.removeUnusedProductFields = function() {
        for(var i = 0; i < $scope.order.products.length; i++) {
            if($scope.order.products[i].productName.length == 0) {
                $scope.order.products.splice(i, 1);
                i--;
            }
        }
    }

    $scope.validateProducts = function() {
        if(!$scope.order || !$scope.productNames) {
            return true;
        }
        var singleProductName = '';
        $scope.incorrectProducts = [];
        for(var i = 0; i < $scope.order.products.length; i++) {
            singleProductName = $scope.order.products[i].productName;
            if($scope.productNames.indexOf(singleProductName) < 0 && singleProductName.length > 0) {
                $scope.incorrectProducts.push(i);
                return false;
            }
        }
        return true;
    }

    $scope.fixDeliveryType = function() {
        if($scope.order.deliveryType) {
            delete $scope.order.deliveryType;
        }
        if($scope.order.deliveryCompany) {
            delete $scope.order.deliveryCompany;
        }
        if($scope.deliverySelector == 'cash') {
            $scope.order.deliveryType = 'Cash';
        } else if($scope.deliverySelector == 'vs_gls') {
            $scope.order.deliveryType = 'VS';
            $scope.order.deliveryCompany = "GLS";
        } else if($scope.deliverySelector == 'vs_cp') {
            $scope.order.deliveryType = 'VS';
            $scope.order.deliveryCompany = 'CP';
        }
        if($scope.order.deliveryType == 'Cash' && $scope.order.payment.vs) {
            delete $scope.order.payment.vs;
        }
    }

    $scope.fixAddressFromSmartForm = function() {
        var str = document.getElementById('hiddenStreet');
        var cit = document.getElementById('city');
        var strNum = document.getElementById('hiddenStreetNumber');
        var zip = document.getElementById('zip');

        $scope.order.address.street = str.value;
        $scope.order.address.city = cit.value;
        $scope.order.address.streetNumber = strNum.value;
        $scope.order.address.psc = zip.value;
    }

    $scope.addOrder = function() {
        $scope.fixAddressFromSmartForm();
        $scope.fixDeliveryType();
        $scope.removeUnusedProductFields();
        medPharmaOrders.isValidVS($scope.order.payment.vs, undefined)
        .then(function(vs) {
            return medPharmaOrders.addOrder($scope.order, $scope.user);
        })
        .then(function(order) {
            socket.emit('refresh_orders_2017', {
                'action': 'addNew',
                'token': medPharmaOthers.getLoggedInUsersToken(),
                'orderId': undefined
            });
            $location.path('/orders');
        })
        .catch(function(err) {
            $scope.vsError = true;
        })
    }

    $scope.confirmEdit = function() {
        medPharmaOrders.isValidVS($scope.order.payment.vs, $scope.orderId)
        .then(function(vs) {
            return medPharmaOrders.saveOrder($scope.orderId, $scope.order, $scope.user)
        })
        .then(function(order) {
            socket.emit('refresh_orders_2017', {
                'action': 'edit',
                'token': medPharmaOthers.getLoggedInUsersToken(),
                'orderId': $scope.orderId
            });
            $location.path('/orders');
        })
        .catch(function(err) {
            $scope.vsError = true;
        })
    }

    $scope.editOrder = function() {
        $scope.increaseLock = false;
        $scope.fixAddressFromSmartForm();
        $scope.fixDeliveryType();
        $scope.removeUnusedProductFields();

        var queueAlert = false;
        var deepCopyEditedOrder = JSON.parse(angular.toJson($scope.order));
        delete deepCopyEditedOrder.lock;
        if($scope.order.inQueue && JSON.stringify(deepCopyEditedOrder) != JSON.stringify($scope.deepCopyOrder)) {
            $scope.order.inQueue = false;
            delete $scope.order.zaslatDate;
            delete $scope.order.zaslatShipmentId;
            queueAlert = true;
        }
        if(queueAlert) {
            var $modalScope = $scope.$new(true);
            var modal = $modal({
                            scope: $modalScope,
                            templateUrl: 'partials/modals/confirmEdit.html',
                            show: false
                        });
            modal.$promise.then(modal.show);

            $modalScope.close = function() {
                this.$hide();
                modal.$promise.then(modal.hide);
                $scope.close();
            }

            $modalScope.confirm = function() {
                modal.$promise.then(modal.hide);
                $scope.confirmEdit();
            }

        } else {
            $scope.confirmEdit();
        }
    }

    $scope.close = function() {
        $scope.increaseLock = false;
        $location.path('/orders');
    }

    $scope.areProductsDisabled = function() {
        var currentDate = new Date();
        if(!$scope.order) {
            return false;
        }
        if($scope.order.payment.paymentDate) {
            var paymentDate = new Date($scope.order.payment.paymentDate);
            return Math.abs(currentDate - paymentDate) / 36e5 >= 24 ? true : false;
        }
        return false;
    }

}]);