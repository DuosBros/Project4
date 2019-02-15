
'use strict'

var myApp = angular.module('medPharmaController');

myApp.controller('GmailCtrl', ['$scope', 'medPharmaOthers', '$window', '$http',
    function($scope, medPharmaOthers, $window, $http) {

        $scope.isMobile = medPharmaOthers.isMobile();

        var authWindow;
        var url;
        $http.get("/rest/gmail/auth")
        .then(function(response) {
            url = response.data;
        })

        $scope.login = function() {
            authWindow = $window.open(url, "Please sign in with Google", "width=500px,height:700px");
        }

        window.onmessage = function(e) {
            authWindow.close();
            var urlWithCode = e.data;
            var idx = urlWithCode.lastIndexOf("code=");
            var codeWithScope = urlWithCode.substring(idx + 5).replace("#", "");
            var code = codeWithScope.substring(0, codeWithScope.lastIndexOf('&'));

            console.log(code);
            console.log(urlWithCode);

            $http.get("/rest/gmail/token?code=" + code)
            .then(function(response) {
                console.log(response);
            })
        }
}]);