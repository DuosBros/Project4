'use strict'

var medPharmaServices = angular.module('medPharmaServices');

medPharmaServices.factory('medPharmaZaslat', ['$http', '$q', 'medPharmaUtilities',
    function($http, $q, medPharmaUtilities) {

        var medPharmaZaslat = {};

        medPharmaZaslat.getAllShipments = function() {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'GET',
                url : '/rest/zaslat/shipments/list',
                headers: requestHeaders,
                cache : false
            })
            .then(function(shipments) {
                deferred.resolve(shipments.data);
            },
            function(err) {
                deferred.reject(err);
            });
            return deferred.promise;
        };

        medPharmaZaslat.getRates = function(weight) {
            var deferred = $q.defer();

            var data = {
                currency: "CZK",
                from: {
                    country: "CZ"
                },
                to: {
                    country: "CZ"
                },
                services: [{
                    code: "cod",
                    data: {
                        value: {
                            value: 1500,
                            currency: "CZK"
                        }
                    }
                }],
                packages: [{
                    weight: weight / 1000,
                    width: 20,
                    height: 20,
                    length: 20
                }]
            }

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'POST',
                url : '/rest/zaslat/rates',
                headers: requestHeaders,
                data: data,
                cache : false
            })
            .then(function(rates) {
                deferred.resolve(rates.data);
            },
            function(err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        medPharmaZaslat.getAllZaslatOrders = function() {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'GET',
                url : '/rest/zaslat/orders/list',
                headers: requestHeaders,
                cache : false
            })
            .then(function(orders) {
                deferred.resolve(orders.data);
            },
            function(err) {
                deferred.reject(err);
            });
            return deferred.promise;
        };

        medPharmaZaslat.getAllZaslatPickups = function() {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'GET',
                url : '/rest/zaslat/pickups/list',
                headers: requestHeaders,
                cache : false
            })
            .then(function(orders) {
                deferred.resolve(orders.data);
            },
            function(err) {
                deferred.reject(err);
            });
            return deferred.promise;
        };

        medPharmaZaslat.getTrackingInfo = function(shipments) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'POST',
                url : '/rest/zaslat/shipments/tracking',
                headers: requestHeaders,
                cache : false,
                data: {shipments}
            })
            .then(function(trackingInfo) {
                deferred.resolve(trackingInfo.data);
            },
            function(err) {
                deferred.reject(err);
            });
            return deferred.promise;
        };

        medPharmaZaslat.createShipment = function(shipment, orderId, shipmentType, note) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'POST',
                url : '/rest/zaslat/shipments/create',
                headers: requestHeaders,
                cache : false,
                data: {shipment, orderId: orderId, shipmentType: shipmentType, note: note}
            })
            .then(function(response) {
                deferred.resolve(response.data);
            },
            function(err) {
                deferred.reject(err);
            });
            return deferred.promise;
        };

        medPharmaZaslat.printLabels = function(shipments) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'POST',
                url : '/rest/zaslat/shipments/label',
                headers: requestHeaders,
                cache : false,
                data: shipments
            })
            .then(function(response) {
                deferred.resolve(response.data);
            },
            function(err) {
                deferred.reject(err);
            });
            return deferred.promise;
        };

        medPharmaZaslat.createPickup = function(pickupObj) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'POST',
                url : '/rest/zaslat/pickup/create',
                headers: requestHeaders,
                cache : false,
                data: pickupObj
            })
            .then(function(response) {
                deferred.resolve(response.data);
            },
            function(err) {
                deferred.reject(err);
            });
            return deferred.promise;
        };

        medPharmaZaslat.removeFromQueue = function(orderIds) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'POST',
                url : '/rest/zaslat/queue/delete',
                headers: requestHeaders,
                cache : false,
                data: orderIds
            })
            .then(function(response) {
                deferred.resolve(response.data);
            },
            function(err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        return medPharmaZaslat;
}]);