
'use strict'

var myApp = angular.module('medPharmaController');

myApp.controller('Orders2016Ctrl', ['$scope', '$modal', 'medPharmaOrders', 'medPharmaOthers', '$location', '$q',
    function($scope, $modal, medPharmaOrders, medPharmaOthers, $location, $q) {

    $scope.disabledActions = true;

    var socket = io.connect();
    socket.on('orders', function(data) {
        $scope.parseNewOrderData(data.allOrders);
    });

    $scope.isMobile = medPharmaOthers.isMobile();

    $scope.orders = [];
    $scope.uncollapsedOrders = [];
    $scope.user = medPharmaOthers.getLoggedInUser();
    $scope.sortValue = "Order Date";

    if($scope.user) {
        getAllOrders();
        $( document ).ready(function() {
            $('html,body').animate({ scrollTop: 99999 }, 'slow');
        });
    } else {
        medPharmaOthers.redirectToLoginPage();
    }

    $scope.filteredOrders = function() {
        var filteredOrders = [];
        if(!$scope.filter || $scope.filter == '') {
            filteredOrders = $scope.orders;
        } else {
            $scope.orders.forEach(function(order) {
                var reducedOrder = JSON.parse(JSON.stringify(order));
                if(reducedOrder.lock) {
                    delete reducedOrder.lock;
                }
                if(reducedOrder.deliveryCompany) {
                    delete reducedOrder.deliveryCompany;
                }
                if(reducedOrder.note) {
                    delete reducedOrder.note;
                }
                var orderToString = JSON.stringify(reducedOrder).toLowerCase();
                if(orderToString.indexOf($scope.filter.toLowerCase()) > 0) {
                    filteredOrders.push(order);
                }
            })
        }
        return filteredOrders;
    }

    $scope.reorder = function() {
        if($scope.sortValue === "Price - asc") {
            $scope.orders = $scope.orders.sort(function (a, b) {return a.totalPrice - b.totalPrice});
        }
        if($scope.sortValue === "Price - desc") {
            $scope.orders = $scope.orders.sort(function (a, b) {return b.totalPrice - a.totalPrice});
        }
        if($scope.sortValue === "Paid") {
            $scope.orders = $scope.orders.sort(function (a, b) {
                if(a.payment.paid && !b.payment.paid) {
                    return 1;
                } else {
                    return -1;
                }
            });
        }
        if($scope.sortValue === "Order Date") {
            $scope.orders = $scope.orders.sort(function (a, b) {
                var aDate = new Date(a.payment.orderDate);
                var bDate = new Date(b.payment.orderDate);
                return aDate - bDate
            });
        }
    }

    $scope.editOrder = function(orderId) {
        medPharmaOrders.verifyLock(orderId, $scope.user)
        .then(function(locked) {
            return medPharmaOrders.setOrderLock(orderId, $scope.user, 15);
        })
        .then(function() {
            return medPharmaOrders.getOrder(orderId);
        })
        .then(function(order) {
            if(!medPharmaOthers.validateItemExists(order, $scope)) {
                //
            } else {
                $location.path('orders/edit/' + orderId);
            }
        })
        .catch(function(err) {
            if(err.data.message.lockedBy) {
                $scope.showConcurrentActionModal(err);
            }
        })
    }

    $scope.deleteOrder = function(orderId) {
        medPharmaOrders.verifyLock(orderId, $scope.user)
        .then(function(locked) {
            return medPharmaOrders.getOrder(orderId);
        })
        .then(function(order) {
            if(!medPharmaOthers.validateItemExists(order, $scope)) {

            } else {
                medPharmaOrders.deleteOrder(orderId)
                .then(function(res) {
                    socket.emit('refresh_orders_2016', {'action': 'delete', 'token': medPharmaOthers.getLoggedInUsersToken()});
                });
            }
        })
        .catch(function(err) {
            if(err.data.message.lockedBy) {
                $scope.showConcurrentActionModal(err);
            }
        })
    }

    $scope.getBackgroundColor = function(order) {
        if(order.payment.paid) {
            return '#dff0d8;';
        } else {
            return '#f2dede';
        }
    }

    $scope.createPdf = function(orderId) {
        $scope.generatingPdf = false;
        var win = window.open('', '_blank');
        medPharmaOrders.verifyLock(orderId, $scope.user)
        .then(function(locked) {
            $scope.generatingPdf = true;
            return medPharmaOrders.generatePdf(orderId);
        })
        .then(function(createdPdfDefinition) {
            $scope.generatingPdf = false;
            pdfMake.createPdf(createdPdfDefinition).open(win);
        })
        .catch(function(err) {
            $scope.generatingPdf = false;
            if(err.data.message.lockedBy) {
                $scope.showConcurrentActionModal(err);
            } else {
                alert("Error during pdf generation");
            }
        })
    }

    $scope.setPaid = function(orderId) {
        medPharmaOrders.verifyLock(orderId, $scope.user)
        .then(function(locked) {
            return medPharmaOrders.getOrder(orderId);
        })
        .then(function(order) {
            if(!medPharmaOthers.validateItemExists(order, $scope)) {

            } else {
                var setValue;
                if(order.payment.paid) {
                    order.payment.paid = false;
                    order.payment.paymentDate = undefined;
                } else {
                    order.payment.paid = true;
                    order.payment.paymentDate = new Date();
                }
                medPharmaOrders.saveOrder(orderId, order, $scope.user)
                .then(function(res) {
                    socket.emit('refresh_orders_2016', {'action': 'setPaid', 'token': medPharmaOthers.getLoggedInUsersToken()});
                });
            }
        })
        .catch(function(err) {
            if(err.data.message.lockedBy) {
                $scope.showConcurrentActionModal(err);
            }
        })
    }

    $scope.showConcurrentActionModal = function(err) {
        var $modalScope = $scope.$new(true);
        $modalScope.username = err.data.message.lockedBy;
        var modal = $modal({
                        scope: $modalScope,
                        templateUrl: 'partials/modals/concurrentAction.html',
                        controller: 'concurrentActionController',
                        show: false
                        });
        modal.$promise.then(modal.show);
    }

    $scope.collapseOrder = function(order) {
        order.collapsed = !order.collapsed;
        if(!order.collapsed) {
            $scope.uncollapsedOrders.push(order.id);
        } else {
            $scope.uncollapsedOrders.splice($scope.uncollapsedOrders.indexOf(order.id), 1);
        }
    }

    $scope.exportOrder = function(orderId) {
        medPharmaOrders.verifyLock(orderId, $scope.user)
        .then(function(locked) {
            return medPharmaOrders.getOrder(orderId);
        })
        .then(function(order) {
            if(!medPharmaOthers.validateItemExists(order, $scope)) {

            } else {
                //TODO
            }
        })
        .catch(function(err) {
            if(err.data.message.lockedBy) {
                $scope.showConcurrentActionModal(err);
            }
        })
    }

    function getAllOrders() {
        medPharmaOrders.getAllOrders(undefined, 'December 31, 2016 23:59:59')
        .then(function(orders) {
            orders.forEach(function(order) {
                order.collapsed = true;
            })
            $scope.orders = orders;
        });
    }

    $scope.parseNewOrderData = function(orders) {
        if($scope.orders && $scope.orders.length == 0) {
            orders.forEach(function(order) {
                order.collapsed = true;
            })
        } else {
            orders.forEach(function(order) {
                if($scope.uncollapsedOrders.indexOf(order.id) == -1) {
                    order.collapsed = true;
                } else {
                    order.collapsed = false;
                }
            })
        }
        if(JSON.stringify($scope.orders) != JSON.stringify(orders)) {
            $scope.orders = orders;
        }
    }

    $scope.updateData = function() {
        $scope.reoder();
    }
}]);