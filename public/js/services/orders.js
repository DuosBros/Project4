'use strict'

var medPharmaServices = angular.module('medPharmaServices', ['ngResource']);

medPharmaServices.factory('medPharmaOrders', ['$http', '$q', '$cookies', 'medPharmaUtilities',
    function($http, $q, $cookies, medPharmaUtilities) {

    var medPharmaOrders = {};

    medPharmaOrders.getAllOrders = function(from, to) {
        var deferred = $q.defer();

        var url = '/rest/orders';
        if (from && to) {
            url += '?from=' + from + '&to=' + to;
        } else if(from) {
            url += '?from=' + from;
        } else if(to) {
            url += '?to=' + to;
        }
        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        $http({
            method : 'GET',
            url : url,
            headers: requestHeaders,
            cache : false,
            })
            .then(function(orders) {
                deferred.resolve(orders.data);
            },
            function(err) {
                deferred.reject(err);
            });
        return deferred.promise;
    };


    medPharmaOrders.verifyLock = function(orderId, user) {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        $http({
            method : 'GET',
            url : '/rest/orders/' + orderId + "/lock?username=" + user,
            headers: requestHeaders,
            cache : false,
            })
            .then(function(lock) {
                deferred.resolve(lock.data);
            },
            function(err) {
                deferred.reject(err);
            });
        return deferred.promise;
    };

    medPharmaOrders.getNextVS = function() {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        $http({
            method : 'GET',
            url : '/rest/orders/vs/next',
            headers: requestHeaders,
            cache : false,
            })
            .then(function(vs) {
                deferred.resolve(vs.data);
            },
            function(err) {
                deferred.reject(err);
            });
        return deferred.promise;
    };

    medPharmaOrders.isValidVS = function(vs, orderId) {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        $http({
            method : 'GET',
            url : '/rest/orders/vs/check/' + vs + '/' + orderId,
            headers: requestHeaders,
            cache : false,
            })
            .then(function(vs) {
                deferred.resolve(vs.data);
            },
            function(err) {
                deferred.reject(err);
            });
        return deferred.promise;
    };

    medPharmaOrders.generatePdf = function(orderId) {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        $http({
            method : 'GET',
            url : '/rest/pdf/orders/' + orderId,
            headers: requestHeaders,
            cache : false,
            })
            .then(function(result) {
                deferred.resolve(result.data);
            },
            function(err) {
                deferred.reject(err);
            });
        return deferred.promise;
    };

    medPharmaOrders.addOrder = function(order, user) {
        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        return $http({
            method : 'POST',
            url : '/rest/orders?username=' + user,
            headers: requestHeaders,
            data : order,
            cache : false,
        });
    };

    medPharmaOrders.setOrderLock = function(orderId, user, seconds) {
        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        return $http({
            method : 'PUT',
            url : '/rest/orders/' + orderId + "/lock?username=" + user + "&seconds=" + seconds,
            headers: requestHeaders,
            cache : false,
        });
    }

    medPharmaOrders.deleteOrder = function(orderId) {
        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        return $http({
            method : 'DELETE',
            url : '/rest/orders/' + orderId,
            headers: requestHeaders,
            cache : false,
        });
    };

    medPharmaOrders.saveOrder = function(orderId, order, user) {
        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        return $http({
            method : 'PUT',
            url : '/rest/orders/' + orderId + "?username=" + user,
            headers: requestHeaders,
            data : order,
            cache : false,
        });
    };

    medPharmaOrders.getOrder = function(orderId) {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        $http({
            method : 'GET',
            url : '/rest/orders/' + orderId,
            headers: requestHeaders,
            cache : false,
            })
            .then(function(order) {
                deferred.resolve(order.data);
            },
            function(err) {
                deferred.reject(err);
            });
        return deferred.promise;
    };

    medPharmaOrders.getOrderByVS = function(vs) {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        $http({
            method : 'GET',
            url : '/rest/orders/find/vs/' + vs,
            headers: requestHeaders,
            cache : false,
            })
            .then(function(order) {
                deferred.resolve(order.data);
            },
            function(err) {
                deferred.reject(err);
            });
        return deferred.promise;
    };

    return medPharmaOrders;
}]);