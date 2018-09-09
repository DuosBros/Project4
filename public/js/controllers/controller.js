
'use strict'

var myApp = angular.module('medPharmaController', []);

myApp.controller('AppCtrl', ['$scope', '$modal', 'medPharmaOrders', 'medPharmaOthers', '$location', 'medPharmaWarehouse', '$q', 'medPharmaZaslat',
    function($scope, $modal, medPharmaOrders, medPharmaOthers, $location, medPharmaWarehouse, $q, medPharmaZaslat) {

    var socket = io.connect();
    socket.on('orders', function(data) {
        $scope.parseNewOrder(data.order, data.id);
        $scope.loadZaslatDataForNotifications();
        //$scope.buildQueue(data.allOrders);
    });

    $scope.isMobile = medPharmaOthers.isMobile();
    $scope.zaslatAddressId = 50470;
    //$scope.zaslatAddressId = 8;

    $scope.orders = [];
    $scope.uncollapsedOrders = [];
    $scope.user = medPharmaOthers.getLoggedInUser();
    $scope.sortValue = "Order Date";
    $scope.labelsToPrint = [];

    if($scope.user) {
        getAllOrders();
        getAllOrdersEagerly();
        medPharmaZaslat.getAllShipments()
        .then(function(shipments) {
            $scope.zaslatShipments = shipments;
            $scope.loadZaslatDataForNotifications();
        })
    } else {
        medPharmaOthers.redirectToLoginPage();
    }

    $scope.$watch('filter', function(newVal, oldVal) {
        $scope.oldFilterLength = oldVal ? oldVal.length : 0;
        if ((oldVal && oldVal.length >= 2) && (!newVal || (newVal && newVal.length < 2) )) {
            getAllOrders(undefined, $scope.ordersCount, true);
        }
    });

    $scope.filteredOrders = function() {
        var filteredOrders = [];
        if (!$scope.filter || $scope.filter == '' || $scope.filter.length < 2) {
            filteredOrders = $scope.orders;
        } else {
            var filter = $scope.filter.toLowerCase();
            $scope.orders = $scope.allOrders;
            $scope.orders.forEach(function(order) {
                var orderFiltered = false;

                if (order.payment && order.payment.vs && order.payment.vs.toString().indexOf(filter) > -1) {
                    orderFiltered = true;
                }

                if (!orderFiltered && order.products && order.products.length > 0) {
                    for (var i = 0; i < order.products.length; i++) {
                        var product = order.products[i];
                        if (product.productName.toLowerCase().indexOf(filter) > -1) {
                            orderFiltered = true;
                            break;
                        }
                    }
                }

                if (!orderFiltered && order.address) {
                    var address = order.address;
                    if (address.firstName && address.firstName.toLowerCase().indexOf(filter) > -1) {
                        orderFiltered = true;
                    }
                    if (!orderFiltered && address.lastName && address.lastName.toLowerCase().indexOf(filter) > -1) {
                        orderFiltered = true;
                    }
                    if (!orderFiltered && address.street && address.street.toLowerCase().indexOf(filter) > -1) {
                        orderFiltered = true;
                    }
                    if (!orderFiltered && address.company && address.company.toLowerCase().indexOf(filter) > -1) {
                        orderFiltered = true;
                    }
                    if (!orderFiltered && address.city && address.city.toLowerCase().indexOf(filter) > -1) {
                        orderFiltered = true;
                    }
                    if (!orderFiltered && address.psc && address.psc.toLowerCase().indexOf(filter) > -1) {
                        orderFiltered = true;
                    }
                    if (!orderFiltered && address.phone && address.phone.toLowerCase().indexOf(filter) > -1) {
                        orderFiltered = true;
                    }
                }

                if (orderFiltered) {
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
                    socket.emit('refresh_orders_2017', {
                        'action': 'delete',
                        'token': medPharmaOthers.getLoggedInUsersToken(),
                        'orderId': orderId
                    });
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
        if (order.state == 'expired') {
            return '#bfbfbf;';
        } else if (order.inQueue) {
            return '#d9edf7;';
        } else if(order.payment.paid) {
            return '#dff0d8;';
        } else if(order.zaslatDate) {
            return '#fcf8e3;';
        } else {
            return '#f2dede';
        }
    }

    $scope.createPdf = function(orderId) {
        $scope.generatingPdf = false;
        medPharmaOrders.verifyLock(orderId, $scope.user)
        .then(function(locked) {
            $scope.generatingPdf = true;
            return medPharmaOrders.generatePdf(orderId);
        })
        .then(function(createdPdfDefinition) {
            $scope.generatingPdf = false;
            var pdfDocGenerator = pdfMake.createPdf(createdPdfDefinition);
            pdfDocGenerator.getBase64((data) => {
                var base64string = 'data:application/pdf;base64,' + data;
                var iframe = "<iframe width='100%' height='100%' src='" + base64string + "'></iframe>"
                var win = window.open();
                win.document.write(iframe);
            });
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

    $scope.isOldAndPaid = function(order) {
        var monthOld = new Date();
        monthOld.setDate(monthOld.getDate() -30);

        if(order.payment.paid && new Date(order.payment.paymentDate) < monthOld) {
            return true;
        }
        return false;
    }

    $scope.setPaid = function(orderId, scopeOrder) {
        medPharmaOrders.verifyLock(orderId, $scope.user)
        .then(function(locked) {
            return medPharmaOrders.getOrder(orderId);
        })
        .then(function(order) {
            if (!medPharmaOthers.validateItemExists(order, $scope)) {

            } else {
                if (order.payment.paid) {
                    order.payment.paid = false;
                    order.payment.paymentDate = undefined;
                } else {
                    order.payment.paid = true;
                    order.payment.paymentDate = new Date();
                    order.state = 'active';
                }
                medPharmaOrders.saveOrder(orderId, order, $scope.user)
                .then(function(res) {
                    scopeOrder.payment.paid = order.payment.paid;
                    scopeOrder.payment.paymentDate = order.payment.paymentDate;
                    socket.emit('refresh_orders_2017', {
                        'action': 'setPaid',
                        'token': medPharmaOthers.getLoggedInUsersToken(),
                        'orderId': orderId
                    });
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
                var $modalScope = $scope.$new(true);

                medPharmaOthers.getAllSendersJson()
                .then(function(senders) {
                    $modalScope.order = order;
                    $modalScope.senders = senders;
                    $modalScope.selectedSender = {};
                    for(var i = 0; i < $modalScope.senders.length; i++) {
                        if($modalScope.senders[i].label === 'Dubina') {
                            $modalScope.selectedSender = $modalScope.senders[i];
                            break;
                        }
                    }
                    $modalScope.tmp = {
                        selectedSender: $modalScope.selectedSender
                    }

                    $modalScope.zaslatData = {};
                    $modalScope.zaslatData.currency = "CZK";
                    $modalScope.zaslatData.payment_type = "invoice";
                    $modalScope.zaslatData.shipments = [];

                    $modalScope.shipment = {};
                    $modalScope.shipment.type = 'ONDEMAND';
                    $modalScope.shipment.carrier = $modalScope.order.deliveryCompany;
                    $modalScope.shipment.reference = $modalScope.order.payment.vs;
                    $modalScope.shipment.note = undefined;

                    //overrides type if date is null
                    $modalScope.shipment.pickup_branch = '1';

                    $modalScope.shipment.pickup_date = undefined;
                    $modalScope.shipment.from = undefined;
                    $modalScope.shipment.to = {
                        firstname: $modalScope.order.address.firstName,
                        surname: $modalScope.order.address.lastName,
                        street: $modalScope.order.address.street + ' ' + $modalScope.order.address.streetNumber,
                        city: $modalScope.order.address.city,
                        zip: $modalScope.order.address.psc,
                        country: "CZ",
                        phone: $modalScope.order.address.phone
                    };
                    if($modalScope.order.address.company) {
                        $modalScope.shipment.to.company = $modalScope.order.address.company;
                    }

                    $modalScope.shipment.services = [];
                    $modalScope.insuranceValue = 6000;
                    $modalScope.insuranceService = {
                        code: "ins",
                        data: {
                            currency: "CZK",
                            value: $modalScope.insuranceValue
                        }
                    };
                    $modalScope.packageService = {
                        code: "cod",
                        data: {
                            bank_account: '2401089228',
                            bank_code: '2010',
                            bank_variable: $modalScope.order.payment.vs,
                            value: {
                                currency: "CZK",
                                value: $modalScope.order.totalPrice
                            }
                        }
                    };
                    $modalScope.shipment.services.push($modalScope.insuranceService);
                    if(!$modalScope.order.payment.bankAccountPayment) {
                        $modalScope.shipment.services.push($modalScope.packageService);
                    }

                    $modalScope.shipment.packages = [];

                    $modalScope.packageDimensions = {
                        weight: 2,
                        width: 20,
                        height: 20,
                        length: 20
                    }
                    $modalScope.shipment.packages.push($modalScope.packageDimensions);

                    $modalScope.zaslatData.shipments.push($modalScope.shipment);

                    $modalScope.formattedZaslatData = JSON.stringify($modalScope.zaslatData, null, 2);
                })

                
                $modalScope.tabs = [
                    {
                        "title": "Services",
                        "template": 'partials/modals/zaslatServices.html'
                    },
                    {
                        "title": "Address",
                        "template": 'partials/modals/zaslatAddresses.html'
                    },
                    // {
                    //     "title": "Shipment",
                    //     "template": "partials/modals/zaslatShipment.html",
                    // },
                    {
                        "title": "Zaslat JSON",
                        "template": 'partials/modals/zaslatJSON.html'
                    }
                ];
                $modalScope.tabs.activeTab = "Services";
                var modal = $modal({
                                scope: $modalScope,
                                templateUrl: 'partials/modals/exportToZaslat.html',
                                show: false
                            });
                modal.$promise.then(modal.show);

                $modalScope.close = function() {
                    this.$hide();
                    modal.$promise.then(modal.hide);
                }

                $modalScope.export = function() {
                    $modalScope.working = true;
                    var newNote = '';
                    if($modalScope.order.note) {
                        newNote += $modalScope.order.note;
                        if($modalScope.shipment.note) {
                            newNote += ' || ';
                        }
                    }
                    if($modalScope.shipment.note) {
                        newNote += $modalScope.shipment.note;
                    }

                    //todo remove this shit after 22. dec
                    if($modalScope.shipment.packages[0].weight > 5) {
                        $modalScope.shipment.packages[0].weight = 5;
                    }
                    medPharmaZaslat.createShipment($modalScope.zaslatData, $modalScope.order.id,
                        $modalScope.shipment.type, newNote)
                    .then(function(response) {
                        $modalScope.working = false;
                        $modalScope.finished = true;
                        $modalScope.zaslatError = false;
                        socket.emit('refresh_orders_2017', {
                            'action': 'setZaslat',
                            'token': medPharmaOthers.getLoggedInUsersToken(),
                            'orderId': $modalScope.order.id
                        });
                    })
                    .catch(function(err) {
                        $modalScope.working = false;
                        $modalScope.zaslatError = err.data.message;
                        alert(err.data.message);
                    })
                }

                $modalScope.$watch('zaslatData', function(newVal, oldVal) {
                    $modalScope.formattedZaslatData = JSON.stringify($modalScope.zaslatData, null, 2);
                }, true);

                $modalScope.$watch('tmp.selectedSender', function(newVal, oldVal) {
                    if(!newVal || !$modalScope.zaslatData) {
                        return;
                    }
                    if($modalScope.tmp.selectedSender.label == 'Dubina') {
                        $modalScope.shipment.from = {
                            id: $scope.zaslatAddressId
                        }
                    } else {
                        $modalScope.shipment.from = {
                            firstname: $modalScope.tmp.selectedSender.firstname,
                            surname: $modalScope.tmp.selectedSender.lastname,
                            street: $modalScope.tmp.selectedSender.street + ' ' + $modalScope.tmp.selectedSender.street_number,
                            city: $modalScope.tmp.selectedSender.city,
                            zip: $modalScope.tmp.selectedSender.zip,
                            country: $modalScope.tmp.selectedSender.country,
                            phone: $modalScope.tmp.selectedSender.phone_number,
                            company: $modalScope.tmp.selectedSender.company
                        };
                    }
                }, true);
            }
        })
        .catch(function(err) {
            if(err.data.message.lockedBy) {
                $scope.showConcurrentActionModal(err);
            }
        })
    }

    $scope.printLabels = function() {
        medPharmaZaslat.printLabels($scope.labelsToPrint)
        .then(function(resp) {
            var iframe = "<iframe width='100%' height='100%' src='" + resp + "'></iframe>";
            var win = window.open();
            win.document.write(iframe);
        })
        .catch(function(err) {
            alert(JSON.stringify(err.data.message));
        })
        .finally(function(err) {
            $scope.labelsToPrint = [];
        })
    }

    $scope.handleLabelsToPrintChange = function(shipmentId) {
        var index = $scope.labelsToPrint.indexOf(shipmentId);
        if (index == -1) {
            $scope.labelsToPrint.push(shipmentId);
        } else {
            $scope.labelsToPrint.splice(index, 1);
        }
    }

    $scope.printLabel = function(shipment) {
        medPharmaZaslat.printLabels([shipment])
        .then(function(resp) {
            window.open(resp, '_blank');
        });
    }

    $scope.showQueue = function() {
        var $modalScope = $scope.$new(true);
        $modalScope.queue = $scope.queue;
        $modalScope.pickupInfo = {
            pickupDate: undefined
        }

        var modal = $modal({
                        scope: $modalScope,
                        templateUrl: 'partials/modals/queue.html',
                        show: false
                    });
        modal.$promise.then(modal.show);

        $modalScope.close = function() {
            this.$hide();
            modal.$promise.then(modal.hide);
        }

        $modalScope.printLabel = function(shipment) {
            medPharmaZaslat.printLabels([shipment])
            .then(function(resp) {
                window.open(resp, '_blank');
            });
        }

        $modalScope.removeFromQueue = function(orderId) {
            medPharmaZaslat.removeFromQueue([orderId])
            .then(function() {
                socket.emit('refresh_orders_2017', {
                    'action': 'delete',
                    'token': medPharmaOthers.getLoggedInUsersToken(),
                    'orderId': orderId
                });
                $modalScope.queue = $modalScope.queue.filter(function(order) {
                    return order.id != orderId;
                });
            })
        }

        $modalScope.pickup = function() {
            var zaslatIds = [];
            $modalScope.pickupObject = {
                pickups: [{
                    date: $modalScope.pickupInfo.pickupDate,
                    time_range: $modalScope.pickupInfo.pickupTime,
                    address: {
                        id: $scope.zaslatAddressId
                    }
                }]
            };
            $modalScope.working = true;
            $modalScope.queue.forEach(function(order) {
                zaslatIds.push(order.zaslatShipmentId);
            });

            medPharmaZaslat.printLabels(zaslatIds)
            .then(function(labelResponse) {
                window.open(labelResponse, '_blank');
                return medPharmaZaslat.createPickup($modalScope.pickupObject);
            })
            .then(function(pickupResponse) {
                $modalScope.working = false;
                $modalScope.finished = true;
                $modalScope.zaslatError = false;
            })
            .catch(function(err) {
                $modalScope.working = false;
                alert(JSON.stringify(err.data.message));
                if(err.data.message.errors.address) {
                    $modalScope.zaslatError = {
                        reason: err.data.message.message,
                        description: err.data.message.errors.address[0]
                    }
                } else {
                    $modalScope.zaslatError = {
                        reason: err.data.message.message,
                        description: err.data.message.errors[0].message
                    }
                }
            })
        }
    }

    function getAllOrders(sinceId, limit, refresh) {
        if (!limit) {
            limit = 100;
        }
        $scope.loading = true;
        medPharmaOrders.getAllOrders('December 31, 2017 23:59:59', 'December 31, 2018 23:59:59', limit, sinceId)
        .then(function(orders) {
            orders.forEach(function(order) {
                order.collapsed = true;
            })

            if (!$scope.orders || refresh) {
                $scope.orders = [];
            }
            $scope.orders = $scope.orders.concat(orders);
            $scope.loading = false;
            $scope.newOrdersCount = orders.length;
            $scope.ordersCount = $scope.orders.length;
            //$scope.buildQueue($scope.orders);
        });
    }

    function getAllOrdersEagerly() {
        medPharmaOrders.getAllOrders('December 31, 2017 23:59:59', 'December 31, 2018 23:59:59')
        .then(function(orders) {
            orders.forEach(function(order) {
                order.collapsed = true;
            })

            $scope.allOrders = orders;
        });
    }

    $scope.loadMore = function() {
        var sinceId = $scope.orders[$scope.orders.length - 1].id;
        getAllOrders(sinceId);
    }

    $scope.buildQueue = function(orders) {
        $scope.queue = orders.filter(function(order) {
            return order.inQueue;
        })
    }

    $scope.parseNewOrder = function(order, orderId) {
        if(!order && !orderId) {
            return;
        }
        if(!orderId) {
            $scope.orders.push(orderId);
            return;
        }
        if(!orderId) {
            $scope.allOrders.push(orderId);
            return;
        }
        //order deleted
        if(!order) {
            for(var i = 0; i < $scope.orders.length; i++) {
                if($scope.orders[i].id == orderId) {
                    $scope.orders.splice(i, 1);
                    break;
                }
            }
            for(var i = 0; i < $scope.allOrders.length; i++) {
                if($scope.allOrders[i].id == orderId) {
                    $scope.allOrders.splice(i, 1);
                    break;
                }
            }
            //return is here so when the socket is called more than once
            //it wont throw exception on collapsed property of the order
            return;
        }
        //order updated
        order.collapsed = true;
        for(var i = 0; i < $scope.uncollapsedOrders.length; i ++) {
            if($scope.uncollapsedOrders[i].id == order.id) {
                order.collapsed = false;
                break;
            }
        }
        for(var i = 0; i < $scope.orders.length; i++) {
            if($scope.orders[i].id == orderId) {
                $scope.orders[i] = order;
                break;
            }
        }
        for(var i = 0; i < $scope.allOrders.length; i++) {
            if($scope.allOrders[i].id == orderId) {
                $scope.allOrders[i] = order;
                break;
            }
        }
    }

    $scope.updateData = function() {
        $scope.reoder();
    }

    $scope.loadWarehouseInfoForNotifications = function() {
        var promises = [];

        medPharmaOthers.getAllProductsJson()
        .then(function(products) {
            $scope.allProductsNames = Object.keys(products);
            $scope.allProductsNames.forEach(function(productName) {
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
            return medPharmaWarehouse.getProductsDataFromDB();
        })
        .then(function(databaseProductsData) {
            $scope.mappedProductsCounts = medPharmaWarehouse.mapProductNamesToAmounts($scope.allProductsNames, databaseProductsData);
            for(var i = 0; i < $scope.allProductsNames.length; i++) {
                var productName = $scope.allProductsNames[i];
                var notificationThreshold = medPharmaWarehouse.getNotificationThreshold(productName);
                if(notificationThreshold) {
                    if(($scope.mappedProductsCounts[productName].total - $scope.productSales[productName].paid - $scope.productSales[productName].notPaid) < notificationThreshold) {
                        $scope.showWarehouseNotification = true;
                        break;
                    }
                } else {
                    if(($scope.mappedProductsCounts[productName].total - $scope.productSales[productName].paid - $scope.productSales[productName].notPaid) < 0) {
                        $scope.showWarehouseNotification = true;
                        break;
                    }
                }
            }
        })
    }

    $scope.loadZaslatDataForNotifications = function() {
        if (!$scope.zaslatShipments) {
            return;
        }
        var checkedDate = new Date();
        checkedDate.setDate(checkedDate.getDate() - 14);

        medPharmaZaslat.getAllZaslatOrders()
        .then(function(zaslatOrders) {
            $scope.notPaidDeliveredOrders = [];
            for (var i = 0; i < zaslatOrders.length; i++) {
                var zaslatOrder = zaslatOrders[i];
                if (!zaslatOrder.payment.paymentDate) {
                    if ($scope.zaslatShipments[zaslatOrder.zaslatShipmentId]) {
                        var deliveryDate = new Date($scope.zaslatShipments[zaslatOrder.zaslatShipmentId].delivery_date);
                        if (deliveryDate < checkedDate) {
                            $scope.notPaidDeliveredOrders.push(zaslatOrder.payment.vs);
                        }
                    }
                }
            }
        })
    }

    $scope.loadWarehouseInfoForNotifications();

}]);