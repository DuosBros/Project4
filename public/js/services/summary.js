'use strict'

var medPharmaServices = angular.module('medPharmaServices');

medPharmaServices.factory('medPharmaSummaries', ['$http', '$q', 'medPharmaUtilities',
    function($http, $q, medPharmaUtilities) {

    var medPharmaSummaries = {};

    medPharmaSummaries.getAllPaidMonthlyOrdersSummary = function() {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        $http({
            method : 'GET',
            url : '/rest/orders/paid/filter/month',
            headers: requestHeaders,
            cache : false,
            })
            .then(function(orders) {
                deferred.resolve(medPharmaSummaries.sortSummaries(orders.data));
            },
            function(err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    medPharmaSummaries.getAllOrderedMonthlyOrdersSummary = function() {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        $http({
            method : 'GET',
            url : '/rest/orders/ordered/filter/month',
            headers: requestHeaders,
            cache : false,
            })
            .then(function(orders) {
                deferred.resolve(medPharmaSummaries.sortSummaries(orders.data));
            },
            function(err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    medPharmaSummaries.sortSummaries = function(data) {
        return data.sort(function(item1, item2) {
            var item1Date = item1._id;
            var item2Date = item2._id;
            if(item2Date.year != item1Date.year) {
                return item2Date.year - item1Date.year;
            } else {
                return item2Date.month - item1Date.month;
            }
        })
    }

    medPharmaSummaries.getAllMonthlyCostsSummary = function() {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        $http({
            method : 'GET',
            url : '/rest/costs/filter/month',
            headers: requestHeaders,
            cache : false,
            })
            .then(function(costs) {
                deferred.resolve(medPharmaSummaries.sortSummaries(costs.data));
            },
            function(err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    medPharmaSummaries.getAggregatedOrdersAndCosts = function() {
        var deferred = $q.defer();

        var singleDate;
        var paidOrdersResult = {};
        var allOrdersResult = {};
		var costsResult = {};
        var resultObject = {};
		medPharmaSummaries.getAllPaidMonthlyOrdersSummary()
		.then(function(orders) {
			orders.forEach(function(order) {
				singleDate = order._id.month + '/' + order._id.year;
				paidOrdersResult[singleDate] = {};
				paidOrdersResult[singleDate].turnover = order.turnover;
                paidOrdersResult[singleDate].totalDeliveryCosts = order.totalDeliveryCosts;
                paidOrdersResult[singleDate].cashOrders = medPharmaSummaries.mapPaymentTypeOrders(order.cashOrders);
                paidOrdersResult[singleDate].vsOrders = medPharmaSummaries.mapPaymentTypeOrders(order.vsOrders);
			});
			return medPharmaSummaries.getAllMonthlyCostsSummary();
		})
		.then(function(costs) {
			costs.forEach(function(cost) {
				singleDate = cost._id.month + '/' + cost._id.year;
				costsResult[singleDate] = cost.costs;
            });

            return medPharmaSummaries.getAllOrderedMonthlyOrdersSummary();
        })
        .then(function(orders) {
            orders.forEach(function(order) {
				singleDate = order._id.month + '/' + order._id.year;
				allOrdersResult[singleDate] = {};
				allOrdersResult[singleDate].turnover = order.turnover;
                allOrdersResult[singleDate].totalDeliveryCosts = order.totalDeliveryCosts;
                allOrdersResult[singleDate].cashOrders = medPharmaSummaries.mapPaymentTypeOrders(order.cashOrders);
                allOrdersResult[singleDate].vsOrders = medPharmaSummaries.mapPaymentTypeOrders(order.vsOrders);
            });

            resultObject.paidOrders = paidOrdersResult;
            resultObject.allOrders = allOrdersResult;
             resultObject.costs = costsResult;

             deferred.resolve(resultObject);
        })

        return deferred.promise;
    }

    medPharmaSummaries.mapPaymentTypeOrders = function(paymentTypeOrdersArray) {
        return paymentTypeOrdersArray.filter(function(arrayItem) {return arrayItem != null});
    }

    medPharmaSummaries.mapDataToSummary = function(paidOrders, costs, allOrders) {
        var deferred = $q.defer();

        var totalCosts = 0;
        var totalTurnover = 0;
		var totalDeliveryCosts = 0;
		var mappedSummary = {};

        var returnObject = {};
		for (var date in paidOrders) {
			if (paidOrders.hasOwnProperty(date)) {
				mappedSummary[date] = {};
				mappedSummary[date].costs = 0;
				mappedSummary[date].profit = 0;
				mappedSummary[date].turnover = 0;
				mappedSummary[date].totalDeliveryCosts = 0;
				mappedSummary[date].turnover = paidOrders[date].turnover;
                mappedSummary[date].totalDeliveryCosts = paidOrders[date].totalDeliveryCosts;
                mappedSummary[date].vsOrders = paidOrders[date].vsOrders;
                mappedSummary[date].cashOrders = paidOrders[date].cashOrders;
				totalTurnover += paidOrders[date].turnover;
				totalDeliveryCosts += paidOrders[date].totalDeliveryCosts;
            }

            if (allOrders.hasOwnProperty(date)) {
                if (!mappedSummary[date]) {
                    mappedSummary[date].orderedTurnover = 0;
                    mappedSummary[date].orderedVsOrders = 0;
                    mappedSummary[date].orderedCashOrders = 0;
                } else {
                    mappedSummary[date].orderedTurnover = allOrders[date].turnover;
                    mappedSummary[date].orderedVsOrders = allOrders[date].vsOrders;
                    mappedSummary[date].orderedCashOrders = allOrders[date].cashOrders;
                }
			}
		}
		for (var date in costs) {
			if (costs.hasOwnProperty(date)) {
				if(!mappedSummary[date]) {
					mappedSummary[date] = {};
					mappedSummary[date].costs = 0;
					mappedSummary[date].turnover = 0;
					mappedSummary[date].profit = 0;
					mappedSummary[date].totalDeliveryCosts = 0;
				}

				mappedSummary[date].costs = costs[date];
			    totalCosts += costs[date];
			}
		}
		for (var date in mappedSummary) {
			if (paidOrders.hasOwnProperty(date)) {
				mappedSummary[date].profit = mappedSummary[date].turnover - mappedSummary[date].costs - mappedSummary[date].totalDeliveryCosts;
			}
		}
        returnObject.mappedSummary = mappedSummary;
        returnObject.totalCosts = totalCosts;
        returnObject.totalTurnover = totalTurnover;
        returnObject.totalDeliveryCosts = totalDeliveryCosts;

        deferred.resolve(returnObject);

        return deferred.promise;
    }


    return medPharmaSummaries;
}]);