
'use strict'

var myApp = angular.module('loginControllers', []);

myApp.controller('LoginController', ['$scope', '$modal', 'medPharmaOthers', '$cookies', '$location', 'medPharmaOrders',
    function($scope, $modal, medPharmaOthers, $cookies, $location, medPharmaOrders) {

    $scope.isMobile = medPharmaOthers.isMobile();

    setInterval(function() {
        medPharmaOthers.isTokenExpired()
        .then(function(isTokenExpired) {
            if(isTokenExpired) {
                $scope.logout();
            }
        })
    }, 3000);

    $scope.openLoginModal = function() {

        var $modalScope = $scope.$new(true);
        $modalScope.loginForm = {};
        $modalScope.loginForm.username = '';
        $modalScope.loginForm.password = '';
        var modal = $modal({
                        scope: $modalScope,
                        templateUrl: 'partials/modals/loginForm.html',
                        show: false
                        });
        modal.$promise.then(modal.show);


        $modalScope.login = function() {
            medPharmaOthers.authenticate($modalScope.loginForm.username, $modalScope.loginForm.password)
            .then(function(loginResult) {
                $scope.loginError = undefined;
                $cookies.put('medPharmaJWT', loginResult.token);
                $cookies.put('medPharmaUsername', loginResult.username);
                $cookies.put('medPharmaJWTExpiracyDate', loginResult.expiracyDate)
                $scope.username = loginResult.username;
                modal.$promise.then(modal.hide);
                $location.path('/orders');
            })
            .catch(function(error) {
                $modalScope.loginError = error.data.message;
                if (!$modalScope.loginError) {
                    $modalScope.loginError = 'Too many invalid login attempts! Try again later';
                }
            })
        }

        $modalScope.close = function() {
            this.$hide();
            modal.$promise.then(modal.hide);
        }
    }

    $scope.username = $cookies.get('medPharmaUsername');
    if($cookies.get('medPharmaJWT') && $location.path() == "/login") {
        $location.path('/orders');
    }

    $scope.logout = function() {
        var reload;
        if($scope.username) {
            reload = true;
        }
        $scope.username = undefined;
        $scope.tokenExpiracyDate = undefined;
        medPharmaOthers.performActionAfterLogout();
        if(reload) {
            window.location.reload();
        }
    }
}]);