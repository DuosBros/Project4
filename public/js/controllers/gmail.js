
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

            if ($scope.loggedIn) {
                $scope.getEmails();
            }
        });
        setInterval(function() {
            medPharmaGmail.isLogged()
            .then(function(resp) {
                $scope.loggedIn = resp;
            });
        }, 5000);

        if ($scope.loggedIn) {
            $scope.getEmails();
        }

        $scope.filteredEmails = function() {
            if (!$scope.loggedIn || !$scope.emails) {
                return undefined;
            }
            if (!$scope.filter || $scope.filter == '') {
                return $scope.emails.emails;
            }

            var filter = $scope.filter.toLowerCase();

            var filteredEmails = [];
            for (var i = 0; i < $scope.emails.emails.length; i++) {
                var email = $scope.emails.emails[i];

                var stringifiedEmail = JSON.stringify(email);

                if (stringifiedEmail.indexOf(filter) > -1) {
                    filteredEmails.push(email);
                }
            }

            return filteredEmails;
        }

        $scope.getEmails = function(nextPageToken) {
            $scope.loading = true;
            medPharmaGmail.getEmails(nextPageToken)
            .then(function(emails) {
                $scope.loading = false;

                if (!$scope.emails) {
                    $scope.emails = emails;
                } else {
                    $scope.emails.nextPageToken = emails.nextPageToken;
                    $scope.emails.emails = $scope.emails.emails.concat(emails.emails);
                }
            })
            .catch(function(err) {
                $scope.loading = false;
                console.log(err);
                alert(err);
            })
        }

        $scope.body = function(bodyParts) {
            var body = '';
            for (var i = 0; i < bodyParts.length; i++) {
                var bodyPart = bodyParts[i];
                if (bodyPart.mimeType == 'text/plain') {
                    var base64 = bodyPart.body.data;
                    try {
                        body += atob(base64);
                        var aaa = 'aa'
                    } catch (err) {
                        var aaaaa = 111;
                    }

                    var a = 1;
                }
            }

            return body;
        }

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
                $scope.getEmails();
            });
        }
}]);