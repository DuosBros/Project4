
'use strict'

var myApp = angular.module('medPharmaController');

myApp.controller('GmailCtrl', ['$scope', 'medPharmaOthers', '$window', 'medPharmaGmail',
    function($scope, medPharmaOthers, $window, medPharmaGmail) {

        $scope.isMobile = medPharmaOthers.isMobile();

        var authWindow;
        var url;

        medPharmaGmail.auth()
        .then(function(response) {
            url = response;
        });

        medPharmaGmail.isLogged()
        .then(function(resp) {
            $scope.loggedIn = resp;
        });
        setInterval(function() {
            medPharmaGmail.isLogged()
            .then(function(resp) {
                $scope.loggedIn = resp;
            });
        }, 5000);

        medPharmaGmail.getEmails()
        .then(function(emails) {
            console.log(emails);
        })
        .catch(function(err) {
            console.log(err);
            alert(err);
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

            medPharmaGmail.getToken(code)
            .then(function(response) {
                $scope.token = response.access_token;
            });
        }
}]);