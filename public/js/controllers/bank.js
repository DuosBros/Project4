
'use strict'

var myApp = angular.module('medPharmaController');

myApp.controller('BankCtrl', ['$scope', '$modal', 'medPharmaBank', 'medPharmaOthers', 'medPharmaOrders', '$filter', 'medPharmaCosts',
    function($scope, $modal, medPharmaBank, medPharmaOthers, medPharmaOrders, $filter, medPharmaCosts) {

        $scope.isMobile = medPharmaOthers.isMobile();

        var socket = io.connect();
        socket.on('orders', function(data) {
            $scope.changeOrder(data.order, data.id);
        });

        $scope.changeOrder = function(order, id) {
            for (var i = 0; i < $scope.orders.length; i++) {
                if ($scope.orders[i].id == id) {
                    $scope.orders[i] = order;
                    return;
                }
            }
        }

        if (medPharmaOthers.getLoggedInUser()) {
            $scope.loading = true;

            $scope.loadingOrders = true;
            $scope.loadingBankInfo = true;
            medPharmaOrders.getAllOrders('September 31, 2017 23:59:59', 'December 31, 2019 23:59:59')
            .then(function(orders) {
                $scope.orders = $scope.filterVsOrders(orders);
                $scope.loadingOrders = false;
                if (!$scope.loadingBankInfo) {
                    $scope.loading = false;
                }
            });

            medPharmaBank.getAllTransactions()
            .then(function(transactions) {
                $scope.bankAccountInfo = transactions.accountStatement.info;
                $scope.transactions = $scope.mapTransactions(transactions.accountStatement.transactionList.transaction);
                console.log(transactions.accountStatement.transactionList.transaction);
                console.log($scope.bankAccountInfo);
                console.log($scope.transactions);
                $scope.loadingBankInfo = false;
                if (!$scope.loadingOrders) {
                    $scope.loading = false;
                }
            })
            .catch(function(err) {
                alert('Error loading the data: ' + JSON.stringify(err.data) + ' The Bank API does not allow multiple requests in the short period of time' +
                 'try again in a few seconds');
            })
        } else {
            medPharmaOthers.redirectToLoginPage();
        }

        $scope.mapTransactions = function(transactionList) {
            var mappedTransactions = [];
            for(var i = transactionList.length -1; i >= 0; i--) {
                var transaction = {};
                transaction.date = $scope.findTransactionDate(transactionList[i]);
                transaction.value = $scope.findTransactionValue(transactionList[i]);
                transaction.from = $scope.findTransactionFrom(transactionList[i]);
                transaction.vs = $scope.findTransactionVs(transactionList[i]);
                transaction.comment = $scope.findTransactionComment(transactionList[i]);

                mappedTransactions.push(transaction);
            }

            return mappedTransactions;
        }

        $scope.isIncorrectTransactionValue = function(vs, value) {
            if (value < 0) {
                return false;
            }
            var incorrentMatchFound = false;
            for (var i = 0; i < $scope.orders.length; i++) {
                var totalPrice = $scope.orders[i].totalPrice;
                var payment = $scope.orders[i].payment;
                if (payment.vs != vs) {
                    continue;
                }
                if (payment.vs == vs) {
                    if (value != totalPrice) {
                        incorrentMatchFound = true;
                    } else {
                        return false;
                    }
                }
            }

            return incorrentMatchFound;
        }

        $scope.createWarningTooltip = function(vs, value) {
            return 'Value of this transaction does not match total price of the referring order!'
        }

        $scope.addCost = function(transaction) {
            $scope.addedCost = undefined;
            var cost = {
                date: new Date(transaction.date),
                cost: Math.abs(transaction.value),
                note: 'Generated from Bank page',
                description: transaction.comment
            }

            medPharmaCosts.addCost(cost)
            .then(function() {
                $scope.addedCost = cost;
            });
        }

        $scope.setPaid = function(vs) {
            var matchingOrder = undefined;
            for (var i = 0; i < $scope.orders.length; i++) {
                var payment = $scope.orders[i].payment;
                if (payment.vs == vs) {
                    matchingOrder = $scope.orders[i];
                    break;
                }
            }
            if (!matchingOrder) {
                alert('Error! No order matches VS: ' + vs);
            }
            medPharmaOrders.verifyLock(matchingOrder.id, $scope.user)
            .then(function(locked) {
                return medPharmaOrders.getOrder(matchingOrder.id);
            })
            .then(function(order) {
                if(!medPharmaOthers.validateItemExists(order, $scope)) {
                } else {
                    var setValue;
                    order.payment.paid = true;
                     order.payment.paymentDate = new Date();
                    medPharmaOrders.saveOrder(matchingOrder.id, order, $scope.user)
                    .then(function(res) {
                        matchingOrder.payment.paid = order.payment.paid;
                        matchingOrder.payment.paymentDate = order.payment.paymentDate;
                        socket.emit('refresh_orders_2017', {
                            'action': 'setPaid',
                            'token': medPharmaOthers.getLoggedInUsersToken(),
                            'orderId': matchingOrder.id
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

        $scope.findTransactionDate = function(transaction) {
            for (var prop in transaction) {
                if (transaction.hasOwnProperty(prop)) {
                    if (!transaction[prop]) {
                        continue;
                    }
                    if (transaction[prop].name == 'Datum') {
                        var date = transaction[prop].value;
                        date = date.substring(0, date.indexOf('+'));
                        return date;
                    }
                }
            }
        }

        $scope.findTransactionValue = function(transaction) {
            for (var prop in transaction) {
                if (transaction.hasOwnProperty(prop)) {
                    if (!transaction[prop]) {
                        continue;
                    }
                    if (transaction[prop].name == 'Objem') {
                        return transaction[prop].value;
                    }
                }
            }
        }

        $scope.findTransactionFrom = function(transaction) {
            for (var prop in transaction) {
                if (transaction.hasOwnProperty(prop)) {
                    if (!transaction[prop]) {
                        continue;
                    }
                    if (transaction[prop].name == 'Protiúčet') {
                        return transaction[prop].value;
                    }
                }
            }

            return 'N/A';
        }

        $scope.findTransactionVs = function(transaction) {
            for (var prop in transaction) {
                if (transaction.hasOwnProperty(prop)) {
                    if (!transaction[prop]) {
                        continue;
                    }
                    if (transaction[prop].name == 'VS') {
                        return transaction[prop].value;
                    }
                }
            }

            return 'N/A';
        }

        $scope.findTransactionComment = function(transaction) {
            for (var prop in transaction) {
                if (transaction.hasOwnProperty(prop)) {
                    if (!transaction[prop]) {
                        continue;
                    }
                    if (transaction[prop].name == 'Komentář') {
                        return transaction[prop].value;
                    }
                }
            }

            return 'N/A';
        }

        $scope.getBackgroundColor = function(transaction) {
            if(transaction.value > 0) {
                return '#dff0d8;';
            } else {
                return '#f2dede';
            }
        }

        $scope.createTooltip = function(vs, value) {
            if (value >= 0) {
                for (var i = 0; i < $scope.orders.length; i++) {
                    var payment = $scope.orders[i].payment;
                    if (payment.vs == vs && payment.paymentDate) {
                        return 'Order paid with this transaction has been marked as paid on: ' + $filter('date')(payment.paymentDate, "HH:mm dd/MM/yyyy");
                    }
                }
            }

            return 'This transaction is not mapped to any item!';
        }

        $scope.isReadyToSetPaid = function(vs, value) {
            if (value >= 0) {
                for (var i = 0; i < $scope.orders.length; i++) {
                    var payment = $scope.orders[i].payment;
                    if (payment.vs == vs && !payment.paymentDate) {
                        return true;
                    }
                }
            }

            return false;
        }

        $scope.filterVsOrders = function(orders) {
            var filteredOrders = [];

            for (var i = 0; i < orders.length; i++) {
                if (orders[i].payment && orders[i].payment.vs) {
                    filteredOrders.push(orders[i]);
                }
            }

            return filteredOrders;
        }

        $scope.filteredTransactions = function(transactions) {
            var filteredTransactions = [];

            if (!$scope.filter || $scope.filter == '') {
                return transactions;
            }

            for (var i = 0; i < transactions.length; i++) {
                var transactionString = JSON.stringify(transactions[i]).toLowerCase();
                if (transactionString.indexOf($scope.filter.toLowerCase()) > 0) {
                    filteredTransactions.push(transactions[i]);
                }
            }

            return filteredTransactions;
        }
}]);