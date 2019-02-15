'use strict'

angular.module('medPharmaRoutes', []).config(function($routeProvider) {

    $routeProvider.when('/orders', {
        templateUrl : '/partials/orders.html',
        controller : 'AppCtrl'
    }),
    $routeProvider.when('/summaries/accounting', {
        templateUrl : '/partials/summary.html',
        controller : 'SummaryCtrl'
    }),
    $routeProvider.when('/costs', {
        templateUrl : '/partials/costs.html',
        controller : 'CostsCtrl'
    }),
    $routeProvider.when('/login', {
        templateUrl : '/partials/login.html',
        controller : 'LoginController'
    }),
    $routeProvider.when('/orders/new', {
        templateUrl : '/partials/orderForm.html',
        controller : 'orderController'
    }),
    $routeProvider.when('/orders/edit/:id', {
        templateUrl : '/partials/orderForm.html',
        controller : 'orderController'
    }),
    $routeProvider.when('/summaries/charts', {
        templateUrl : '/partials/charts.html',
        controller : 'chartsController'
    }),
    $routeProvider.when('/warehouse', {
        templateUrl : '/partials/warehouse.html',
        controller : 'warehouseController'
    }),
    $routeProvider.when('/zaslat', {
        templateUrl : '/partials/zaslat.html',
        controller : 'zaslatController'
    }),
    $routeProvider.when('/bank', {
        templateUrl : '/partials/bank.html',
        controller : 'BankCtrl'
    }),
    $routeProvider.when('/archive/orders2016', {
        templateUrl : '/partials/orders.html',
        controller : 'Orders2016Ctrl'
    }),
    $routeProvider.when('/archive/orders2017', {
        templateUrl : '/partials/orders.html',
        controller : 'Orders2017Ctrl'
    }),
    $routeProvider.when('/scripts', {
        templateUrl : '/partials/scripts.html',
        controller : 'ScriptsCtrl'
    }),
    $routeProvider.when('/gmail', {
        templateUrl : '/partials/gmail.html',
        controller : 'GmailCtrl'
    })
});