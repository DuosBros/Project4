'use strict'

var medPharmaServices = angular.module('medPharmaServices');

medPharmaServices.factory('medPharmaWarehouse', ['$http', '$q', 'medPharmaUtilities',
    function($http, $q, medPharmaUtilities) {

        var medPharmaWarehouse = {};

        medPharmaWarehouse.getNotificationThreshold = function(productName) {

            var notificationThresholds = {
                'Colagen': 100,
                'Vceli materi kasicka': 100,
                'Zraloci chrupavka': 100,
                'Glucosamin': 100
            }

            return notificationThresholds[productName];
        }

        medPharmaWarehouse.editProductAmount = function(productName, newValue, calculationDate, difference, user) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'PUT',
                url : '/rest/warehouse/products/' + productName,
                headers: requestHeaders,
                cache : false,
                data : {newValue: newValue, calculationDate: calculationDate, difference: difference, user: user}
                })
                .then(function() {
                    deferred.resolve();
                },
                function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        };

        medPharmaWarehouse.getProductsDataFromDB = function() {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'GET',
                url : '/rest/warehouse/products/',
                headers: requestHeaders,
                cache : false
                })
                .then(function(productsData) {
                    deferred.resolve(productsData.data);
                },
                function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        };

        medPharmaWarehouse.getSingleProductDataFromDB = function(productName) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'GET',
                url : '/rest/warehouse/products/' + productName,
                headers: requestHeaders,
                cache : false
                })
                .then(function(productData) {
                    deferred.resolve(productData.data);
                },
                function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        };

        medPharmaWarehouse.calculateProductsSales = function(productName) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'GET',
                url : '/rest/warehouse/products/' + productName + '/sales',
                headers: requestHeaders,
                cache : false
                })
                .then(function(productsData) {
                    deferred.resolve(productsData.data);
                },
                function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        };

        medPharmaWarehouse.addNewProduct = function(product) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'POST',
                url : '/rest/products',
                headers: requestHeaders,
                data: product,
                cache : false
                })
                .then(function(result) {
                    deferred.resolve(result);
                },
                function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        };

        medPharmaWarehouse.editProductConfig = function(originalName, newName, newPrice, weight, tax) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'PUT',
                url : '/rest/products/' + originalName,
                data : { name: newName, price: newPrice, weight: weight, tax: tax },
                headers: requestHeaders,
                cache : false
                })
                .then(function(result) {
                    deferred.resolve(result);
                },
                function(err) {
                    deferred.reject(err);
                });

            return deferred.promise;
        }

        medPharmaWarehouse.removeProduct = function(product) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'DELETE',
                url : '/rest/products/' + product,
                headers: requestHeaders,
                cache : false
                })
                .then(function(result) {
                    deferred.resolve(result);
                },
                function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        };

        medPharmaWarehouse.mapProductNamesToAmounts = function(productNames, databaseData) {
            var mappedDatabaseObject = {};
            databaseData.forEach(function(product) {
                mappedDatabaseObject[product.productName] = {total: product.amount, calculationDate: new Date(product.calculationDate)};
            })

            var mappedDefaultProductsCounts = {};

            productNames.forEach(function(productName) {
                mappedDefaultProductsCounts[productName] = {total: 0, booked: 0, calculationDate: new Date()};
            })

            return Object.assign({}, mappedDefaultProductsCounts, mappedDatabaseObject);
        };


        return medPharmaWarehouse;
}]);