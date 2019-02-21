
'use strict'

var myApp = angular.module('medPharmaController');

myApp.controller('GmailCtrl', ['$scope', 'medPharmaOthers', '$window', 'medPharmaGmail', '$modal',
    function($scope, medPharmaOthers, $window, medPharmaGmail, $modal) {

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

        $scope.openSendEmailModal = function() {

            var $modalScope = $scope.$new(true);
            $modalScope.email = {
                subject: '',
                from: 'From: TN MephaGroup <tnmephagroup@gmail.com>\n',
                to: '',
                body: ''
            }

            var modal = $modal({
                            scope: $modalScope,
                            templateUrl: 'partials/modals/sendEmail.html',
                            show: false
                            });
            modal.$promise.then(modal.show);

            $modalScope.sendEmail = function() {
                $modalScope.sendingEmail = true;

                var from = $modalScope.email.from;
                var to = 'To: <' + $modalScope.email.to + '>\n';
                var subject = 'Subject: ' + $modalScope.email.subject + '\n';
                var date = new Date();

                var body = $modalScope.email.body;

                var email = from + to + subject + date + '\n\n' + body;

                var data = {
                    email: email
                }

                medPharmaGmail.sendEmail(data)
                .then(function(result) {
                    $modalScope.sendingEmail = false;
                    console.log(result);

                    $modalScope.email = {
                        subject: '',
                        from: 'From: TN MephaGroup <tnmephagroup@gmail.com>\n',
                        to: '',
                        body: ''
                    }
                })
                .catch(function(err) {
                    $modalScope.sendingEmail = false;
                    console.log(err);

                    $modalScope.email = {
                        subject: '',
                        from: 'From: TN MephaGroup <tnmephagroup@gmail.com>\n',
                        to: '',
                        body: ''
                    }
                    alert(err);
                })
            }

            $modalScope.close = function() {
                this.$hide();
            }
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
            authWindow = $window.open(url, "Please sign in with Google", "width=300px,height:500px");
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