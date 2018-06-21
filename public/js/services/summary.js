'use strict'

var medPharmaServices = angular.module('medPharmaServices');

medPharmaServices.factory('medPharmaSummaries', ['$http', '$q', 'medPharmaUtilities',
    function($http, $q, medPharmaUtilities) {

    var medPharmaSummaries = {};

    medPharmaSummaries.getAllMonthlyOrdersSummary = function() {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        $http({
            method : 'GET',
            url : '/rest/orders/filter/month',
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
		var ordersResult = {};
		var costsResult = {};
        var resultObject = {};
		medPharmaSummaries.getAllMonthlyOrdersSummary()
		.then(function(orders) {
			orders.forEach(function(order) {
				singleDate = order._id.month + '/' + order._id.year;
				ordersResult[singleDate] = {};
				ordersResult[singleDate].turnover = order.turnover;
                ordersResult[singleDate].totalDeliveryCosts = order.totalDeliveryCosts;
                ordersResult[singleDate].cashOrders = medPharmaSummaries.mapPaymentTypeOrders(order.cashOrders);
                ordersResult[singleDate].vsOrders = medPharmaSummaries.mapPaymentTypeOrders(order.vsOrders);
			});
			return medPharmaSummaries.getAllMonthlyCostsSummary();
		})
		.then(function(costs) {
			costs.forEach(function(cost) {
				singleDate = cost._id.month + '/' + cost._id.year;
				costsResult[singleDate] = cost.costs;
			});
            resultObject.orders = ordersResult;
            resultObject.costs = costsResult;
            deferred.resolve(resultObject);
		})

        return deferred.promise;
    }

    medPharmaSummaries.mapPaymentTypeOrders = function(paymentTypeOrdersArray) {
        return paymentTypeOrdersArray.filter(function(arrayItem) {return arrayItem != null});
    }

    medPharmaSummaries.mapDataToSummary = function(orders, costs) {
        var deferred = $q.defer();

        var totalCosts = 0;
        var totalTurnover = 0;
		var totalDeliveryCosts = 0;
		var mappedSummary = {};

        var returnObject = {};
		for (var date in orders) {
			if (orders.hasOwnProperty(date)) {
				mappedSummary[date] = {};
				mappedSummary[date].costs = 0;
				mappedSummary[date].profit = 0;
				mappedSummary[date].turnover = 0;
				mappedSummary[date].totalDeliveryCosts = 0;
				mappedSummary[date].turnover = orders[date].turnover;
                mappedSummary[date].totalDeliveryCosts = orders[date].totalDeliveryCosts;
                mappedSummary[date].vsOrders = orders[date].vsOrders;
                mappedSummary[date].cashOrders = orders[date].cashOrders;
				totalTurnover += orders[date].turnover;
				totalDeliveryCosts += orders[date].totalDeliveryCosts;
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
			if (orders.hasOwnProperty(date)) {
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