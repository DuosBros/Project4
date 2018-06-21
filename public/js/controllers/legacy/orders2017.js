
'use strict'

var myApp = angular.module('medPharmaController');

myApp.controller('Orders2017Ctrl', ['$scope', '$modal', 'medPharmaOrders', 'medPharmaOthers', '$location', 'medPharmaWarehouse', '$q', 'medPharmaZaslat',
    function($scope, $modal, medPharmaOrders, medPharmaOthers, $location, medPharmaWarehouse, $q, medPharmaZaslat) {

    var socket = io.connect();
    socket.on('orders', function(data) {
        $scope.parseNewOrder(data.order, data.id);
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
        if(order.inQueue) {
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
                        pickupDateObject: undefined,
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

                    //todo remove after 22. dec
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

                $modalScope.$watch('tmp.pickupDateObject', function(newVal, oldVal) {
                    if(!$modalScope.shipment) {
                        return;
                    }
                    if(!newVal || newVal == '') {
                        $modalScope.shipment.pickup_date = undefined;
                        return;
                    }
                    var year = newVal.getFullYear().toString();
                    var month = (newVal.getMonth() + 1).toString();
                    var day = newVal.getDate().toString();
                    if(month.length == 1) {
                        month = "0" + month;
                    }
                    if(day.length == 1) {
                        day = "0" + day;
                    }
                    $modalScope.shipment.pickup_date = year + '-' + month + '-' + day;
                });
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

    function getAllOrders() {
        medPharmaOrders.getAllOrders('December 31, 2016 23:59:59', 'December 31, 2017 23:59:59')
        .then(function(orders) {
            orders.forEach(function(order) {
                order.collapsed = true;
            })
            var newestOrders = orders.slice(0, 35);
            var olderOrders = orders.slice(35, orders.length);
            $scope.orders = newestOrders;

            setTimeout(function() {
                $scope.orders = newestOrders.concat(olderOrders);
            }, 1000);
            //$scope.buildQueue($scope.orders);
        });
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
        //order deleted
        if(!order) {
            for(var i = 0; i < $scope.orders.length; i++) {
                if($scope.orders[i].id == orderId) {
                    $scope.orders.splice(i, 1);
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
                return;
            }
        }
    }

    $scope.updateData = function() {
        $scope.reoder();
    }

    $scope.loadWarehouseInfoForNotifications = function() {
        var notifiedProducts = ['Colagen', 'Vceli materi kasicka', 'Zraloci chrupavka', 'Glucosamin'];
        var notificationValue = 100;
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
                if(notifiedProducts.indexOf(productName) >= 0) {
                    if(($scope.mappedProductsCounts[productName].total - $scope.productSales[productName].paid - $scope.productSales[productName].notPaid) < notificationValue) {
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
    $scope.loadWarehouseInfoForNotifications();

}]);