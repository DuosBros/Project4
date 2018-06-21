
'use strict'

var myApp = angular.module('medPharmaController');

myApp.controller('ScriptsCtrl', ['$scope', 'medPharmaOthers', 'medPharmaScripts',
    function($scope, medPharmaOthers, medPharmaScripts) {

        $scope.isMobile = medPharmaOthers.isMobile();


        $scope.exportByVs = function(vs) {
            $scope.initVariables();

            medPharmaScripts.exportByVs(vs)
            .then(function() {
                var message = 'VS ' + vs + ' successfully exported to dropbox';
                $scope.handleSuccess(message);
            })
            .catch(function(err) {
                $scope.handleError(err);
            })
        }

        $scope.addUser = function(username, password) {
            $scope.initVariables();

            var data = {
                username: username,
                password: password
            }

            medPharmaScripts.addUser(data)
            .then(function() {
                var message = 'User ' + username + ' added';
                $scope.handleSuccess(message);
            })
            .catch(function(err) {
                $scope.handleError(err);
            })
        }

        $scope.addSender = function(firstNameSender, lastNameSender, streetSender, citySender,
            zipSender, streetNumberSender, phoneNumberSender, companySender, countrySender, labelSender) {

            $scope.initVariables();

            var data = {
                firstName: firstNameSender,
                lastName: lastNameSender,
                street: streetSender,
                city: citySender,
                zip: zipSender,
                streetNumber: streetNumberSender,
                phoneNumber: phoneNumberSender,
                company: companySender,
                country: countrySender,
                label: labelSender
            }

            medPharmaScripts.addSender(data)
            .then(function() {
                var message = 'Sender added';
                $scope.handleSuccess(message);
            })
            .catch(function(err) {
                $scope.handleError(err);
            })
        }

        $scope.exportData = function(exportFromDay, exportFromMonth, exportFromYear, exportToDay, exportToMonth, exportToYear) {
            $scope.initVariables();

            var data = {
                fromDay: exportFromDay,
                fromMonth: exportFromMonth,
                fromYear: exportFromYear,
                toDay: exportToDay,
                toMonth: exportToMonth,
                toYear: exportToYear
            }

            medPharmaScripts.exportData(data)
            .then(function() {
                var message = 'Data successfully exported to dropbox';
                $scope.handleSuccess(message);
            })
            .catch(function(err) {
                $scope.handleError(err);
            })
        }

        $scope.exportNoVsData = function(exportFromDay, exportFromMonth, exportFromYear, exportToDay, exportToMonth, exportToYear,
                firstName, lastName, street, city, zip, streetNumber, phone) {
            $scope.initVariables();

            var data = {
                fromDay: exportFromDay,
                fromMonth: exportFromMonth,
                fromYear: exportFromYear,
                toDay: exportToDay,
                toMonth: exportToMonth,
                toYear: exportToYear,
                firstName: firstName,
                lastName: lastName,
                street: street,
                city: city,
                zip: zip,
                streetNumber: streetNumber,
                phone: phone
            }

            medPharmaScripts.exportNoVsData(data)
            .then(function() {
                var message = 'Data successfully exported to dropbox';
                $scope.handleSuccess(message);
            })
            .catch(function(err) {
                $scope.handleError(err);
            })
        }

        $scope.initVariables = function() {
            $scope.working = true;
            $scope.error = undefined;
            $scope.message = undefined;
            $scope.success = undefined;
        }

        $scope.handleError = function(err) {
            $scope.error = true;
            if (err && err.data) {
                $scope.message = err.data.message;
            }
            $scope.working = false;
            $scope.success = undefined;
        }

        $scope.handleSuccess = function(message) {
            $scope.message = message;
            $scope.working = false;
            $scope.success = true;
            $scope.error = undefined;
        }
}]);