'use strict'

var medPharmaServices = angular.module('medPharmaServices');

medPharmaServices.factory('medPharmaOthers', ['$http', '$q', '$cookies', '$location', '$modal', 'medPharmaUtilities',
    function($http, $q, $cookies, $location, $modal, medPharmaUtilities) {

    var medPharmaOthers = {};
    var cachedProductsJson;
    var cachedProductsJsonWithOther;

    medPharmaOthers.getAllProductsJson = function() {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();

        $http({
            method : 'GET',
            url : '/rest/products/allProducts',
            headers: requestHeaders,
            cache : false,
        })
        .then(function(order) {
            if(order.data.Other != undefined) {
                delete order.data.Other;
            }
            cachedProductsJson = order.data;
            deferred.resolve(order.data);
        },
        function(err) {
            deferred.reject(err);
        });

        return deferred.promise;
    };

    medPharmaOthers.getAllSendersJson = function() {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        $http({
            method : 'GET',
            url : '/rest/config/senders',
            headers: requestHeaders,
            cache : false,
        })
        .then(function(response) {
            deferred.resolve(response.data);
        },
        function(err) {
            deferred.reject(err);
        });
        return deferred.promise;
    };

    medPharmaOthers.getAllProductsJsonWithOtherValue = function() {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        if(cachedProductsJsonWithOther) {
            deferred.resolve(cachedProductsJsonWithOther);
        } else {
            $http({
                method : 'GET',
                url : '/rest/products/allProducts',
                headers: requestHeaders,
                cache : false,
            })
            .then(function(order) {
                cachedProductsJsonWithOther = order.data;
                deferred.resolve(order.data);
            },
            function(err) {
                deferred.reject(err);
            });
        }
        return deferred.promise;
    };

    medPharmaOthers.validateToken = function() {
        var deferred = $q.defer();

        var requestHeaders = medPharmaUtilities.createAuthorizedRequestHeaders();
        $http({
            method : 'GET',
            url : '/rest/validateToken',
            headers: requestHeaders,
            cache : false,
        })
        .then(function() {
            deferred.resolve();
        },
        function(err) {
            medPharmaOthers.performActionAfterLogout();
            deferred.reject(err);
        });
        return deferred.promise;
    }

    medPharmaOthers.authenticate = function(username, password) {
        var deferred = $q.defer();

        $http({
            method : 'POST',
            url : '/rest/authenticate?username=' + username + '&password=' + password,
            cache : false,
        })
        .then(function(loginData) {
            deferred.resolve(loginData.data);
        },
        function(err) {
            deferred.reject(err);
        });
        
        return deferred.promise;
    };

    medPharmaOthers.isTokenExpired = function() {
        var deferred = $q.defer();
        var tokenExpiracyCookie = $cookies.get('medPharmaJWTExpiracyDate');
        var tokenExpiracyDate = new Date(tokenExpiracyCookie);
        var now = new Date();
        if(tokenExpiracyCookie) {
            deferred.resolve(tokenExpiracyDate < now);
        } else {
            deferred.resolve(true);
        }
        return deferred.promise;
    }

    medPharmaOthers.getLoggedInUser = function() {
        var user = $cookies.get('medPharmaUsername');
        if(user) {
            return user;
        } else {
            return undefined;
        }
    }

    medPharmaOthers.isMobile = function() {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }

    medPharmaOthers.getLoggedInUsersToken = function() {
        return $cookies.get('medPharmaJWT');
    }

    medPharmaOthers.performActionAfterLogout = function() {
        $cookies.remove('medPharmaJWT');
        $cookies.remove('medPharmaUsername');
        $cookies.remove('medPharmaJWTExpiracyDate');
        $location.path('/login');
    }

    medPharmaOthers.redirectToLoginPage = function() {
        $location.path('/login');
    }

    medPharmaOthers.validateItemExists = function(item, scope) {
        if(!item) {
            var $modalScope = scope.$new(true);
            var modal = $modal({
                            scope: $modalScope,
                            templateUrl: 'partials/modals/notExistsNotification.html',
                            controller: 'notExistsNotificationController',
                            show: false
                            });
            modal.$promise.then(modal.show);
            return false;
        } else {
            return true;
        }
    }

    return medPharmaOthers;
}]);