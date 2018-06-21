
'use strict'

var myApp = angular.module('medPharmaController');

myApp.controller('zaslatController', ['$scope', 'medPharmaOthers', 'medPharmaZaslat', '$modal', '$q', 'medPharmaOrders',
	function($scope, medPharmaOthers, medPharmaZaslat, $modal, $q, medPharmaOrders) {
		$scope.isMobile = medPharmaOthers.isMobile();


        $scope.firstFetch = true;
        $scope.fetchData = function() {
            $scope.loadingData = true;
            $scope.loadingError = false;
            medPharmaZaslat.getAllShipments()
            .then(function(shipments) {
                if(!$scope.firstFetch) {
                    for (var shipment in $scope.shipments) {
                        if ($scope.shipments.hasOwnProperty(shipment)) {
                            if(shipments[shipment]) {
                                shipments[shipment].collapsed = $scope.shipments[shipment].collapsed;
                                shipments[shipment].orderInfo = $scope.shipments[shipment].orderInfo;
                            }
                        }
                    }
                }
                $scope.shipments = shipments;

                return medPharmaZaslat.getAllZaslatOrders();
            })
            .then(function(orders) {
                $scope.orders = orders;
                $scope.loadingData = false;
                $scope.firstFetch = false;

                $scope.mapOrdersToShipments($scope.orders, $scope.shipments);
            })
            .catch(function(err) {
                $scope.loadingData = false;
                $scope.loadingError = true;
            })
        }
        $scope.fetchData();

        setInterval(function() {
            $scope.fetchData();
        }, 1000 * 60);

        $scope.mapOrdersToShipments = function() {
            $scope.orders.forEach(function(order) {
                if($scope.shipments[order.zaslatShipmentId]) {
                    $scope.shipments[order.zaslatShipmentId].date = order.zaslatDate;
                }
            })
        }

        $scope.getOrderDetail = function(shipmentId, vs) {
            medPharmaOrders.getOrderByVS(vs)
            .then(function(order) {
                $scope.shipments[shipmentId].orderInfo = order;
            })
        }

        $scope.toggleCollapse = function(shipment) {
            if(!$scope.shipments[shipment].orderInfo) {
                $scope.getOrderDetail(shipment, $scope.shipments[shipment].reference);
            }
            $scope.shipments[shipment].collapsed = !$scope.shipments[shipment].collapsed;
        }

        $scope.showDetails = function(shipment) {
            var $modalScope = $scope.$new(true);

            var modal = $modal({
                            scope: $modalScope,
                            templateUrl: 'partials/modals/shipmentDetail.html',
                            show: false
                        });
            modal.$promise.then(modal.show);


            medPharmaZaslat.getTrackingInfo([shipment])
            .then(function(trackingInfo) {
                $modalScope.shipmentId = shipment;
                $modalScope.shipmentPackage = trackingInfo[$modalScope.shipmentId].packages[0];
                if($modalScope.shipmentPackage && $modalScope.shipmentPackage[0]) {
                    $modalScope.currentStatus = $modalScope.shipmentPackage[0].name;
                } else {
                    $modalScope.currentStatus = trackingInfo[$modalScope.shipmentId].status;
                }
            })
            .catch(function(error) {
                console.log(error);
            })

            $modalScope.close = function() {
                this.$hide();
                modal.$promise.then(modal.hide);
            }
        }

        $scope.openSendersModal = function() {
            var $modalScope = $scope.$new(true);

            var modal = $modal({
                            scope: $modalScope,
                            templateUrl: 'partials/modals/sendersModal.html',
                            show: false
                        });
            modal.$promise.then(modal.show);


            medPharmaOthers.getAllSendersJson()
            .then(function(senders) {
                $modalScope.senders = senders;
                $modalScope.selectedSender = {};
                Object.keys($modalScope.senders).forEach(function(key) {
                    if($modalScope.senders[key].id == 1) {
                        $modalScope.selectedSender = $modalScope.senders[key];
                    }
                });
            })

            $modalScope.close = function() {
                this.$hide();
                modal.$promise.then(modal.hide);
            }
        }

        if(!medPharmaOthers.getLoggedInUser()) {
            medPharmaOthers.redirectToLoginPage();
        } else {
            $scope.loggedUser = medPharmaOthers.getLoggedInUser();
        }
}]);