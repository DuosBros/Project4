'use strict'

var medPharmaServices = angular.module('medPharmaServices');

medPharmaServices.factory('medPharmaWarehouse', ['$http', '$q', 'medPharmaUtilities',
    function($http, $q, medPharmaUtilities) {

        var medPharmaWarehouse = {};

        medPharmaWarehouse.editProductAmount = function(productName, calculationDate, difference, user, notificationThreshold) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'PUT',
                url : '/rest/warehouse/products/' + productName,
                headers: requestHeaders,
                cache : false,
                data : {calculationDate: calculationDate,
                    difference: difference, user: user, notificationThreshold: notificationThreshold}
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

        medPharmaWarehouse.editProductConfig = function(originalName, newName, newPrice, weight, tax, category) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'PUT',
                url : '/rest/products/' + originalName,
                data : { name: newName, price: newPrice, weight: weight, tax: tax, category: category },
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

        medPharmaWarehouse.mapProductNamesToAmountsPromise = function(productNames, productData) {
            var deferred = $q.defer();

            var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
            $http({
                method : 'POST',
                url : '/rest/mapProductNamesToAmounts',
                data : { productNames: productNames, productData: productData },
                headers: requestHeaders,
                cache : false
                })
                .then(function(result) {
                    deferred.resolve(result.data);
                },
                function(err) {
                    deferred.reject(err);
                });

            return deferred.promise;
        }


        return medPharmaWarehouse;
}]);