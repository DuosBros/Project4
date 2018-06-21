'use strict'


var medPharmaApp = angular.module('medPharmaApp',
            [
                'ngRoute',
                'ngSanitize',
                'ngCookies',
                'medPharmaController',
                'loginControllers',
                'medPharmaServices',
                'medPharmaRoutes',
                'mgcrea.ngStrap'
            ]);

medPharmaApp.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $routeProvider.otherwise({
            redirectTo : '/login'
        });

        $locationProvider.html5Mode({enabled: true, requireBase: false});

}])