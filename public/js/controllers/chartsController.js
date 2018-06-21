
'use strict'

var myApp = angular.module('medPharmaController');

myApp.controller('chartsController', ['$scope', 'medPharmaOthers', 'medPharmaCharts', 'medPharmaSummaries',
	function($scope, medPharmaOthers, medPharmaCharts, medPharmaSummaries) {
	
		if(!medPharmaOthers.getLoggedInUser()) {
			medPharmaOthers.redirectToLoginPage();
		}

		$scope.isMobile = medPharmaOthers.isMobile();
		Chart.defaults.global.maintainAspectRatio = false;

		$scope.mapAllProductSales = function(productNames, productSales) {
			var mappedData = {};
			for(var i = 0; i < productNames.length; i++) {
				mappedData[productNames[i]] = {
					amount: 0,
					count: 0
				};
			}
			var allSalesDataObject = productSales.reduce(function(mappedData, obj) {
				mappedData[obj._id] = {};
				mappedData[obj._id].amount = obj.totalAmount;
				mappedData[obj._id].count = obj.totalCount;
				return mappedData;
			}, {});
			return Object.assign({}, mappedData, allSalesDataObject);
		}

		$scope.mapTotalSales = function(mappedSummary) {
			var mappedData = {};
			var chartPoints = Object.keys(mappedSummary).reverse();
			var monthlyTurnOvers = [];
			for(var i = 0; i < chartPoints.length; i++) {
				monthlyTurnOvers[i] = mappedSummary[chartPoints[i]].turnover;
			}

			mappedData.months = chartPoints;
			mappedData.turnovers = monthlyTurnOvers;
			return mappedData;
		}

		$scope.generateProductSalesChart = function(aggregatedChartData) {
			var data = {};

			var dataArray = [];
			data.labels = Object.keys($scope.allProductSalesChartData);

			data.labels.forEach(function(label) {
				dataArray.push(aggregatedChartData[label].amount);
			});

			data.datasets = [];
			data.datasets[0] = {};
			data.datasets[0].label = "Total Product's Sales (Kč)";
			data.datasets[0].backgroundColor = 'rgba(255, 99, 132, 0.2)';
			data.datasets[0].borderColor = 'rgba(255,99,132,1)';
			data.datasets[0].borderWidth = 1;
			data.datasets[0].data = dataArray;

			var ctx = document.getElementById("productSalesChart").getContext("2d");

			var myBarChart = new Chart(ctx, {
				type: 'bar',
				data: data,
				options: {
					scales: {
						yAxes: [{
							ticks: {
								stepSize: 30000,
							}
						}],
						xAxes: [{
							ticks: {
								autoSkip: false,
								maxRotation: 90,
								minRotation: 90
							}
						}]
					}
				}
			});
		}

		$scope.generateProductCountsChart = function(aggregatedChartData) {
			var data = {};

			var dataArray = [];
			data.labels = Object.keys($scope.allProductSalesChartData);

			data.labels.forEach(function(label) {
				dataArray.push(aggregatedChartData[label].count);
			});

			data.datasets = [];
			data.datasets[0] = {};
			data.datasets[0].label = "Total Numbers of Products Sold";
			data.datasets[0].backgroundColor = 'rgba(255, 99, 132, 0.2)';
			data.datasets[0].borderColor = 'rgba(255,99,132,1)';
			data.datasets[0].borderWidth = 1;
			data.datasets[0].data = dataArray;

			var ctx = document.getElementById("productCountChart").getContext("2d");

			var myBarChart = new Chart(ctx, {
				type: 'bar',
				data: data,
				options: {
					scales: {
						yAxes: [{
							ticks: {
								stepSize: 200,
							}
						}],
						xAxes: [{
							ticks: {
								autoSkip: false,
								maxRotation: 90,
								minRotation: 90
							}
						}]
					}
				}
			});
		}

		$scope.generateTotalSalesChart = function(aggregatedChartData) {
			var data = {};
			var avgTurnover = aggregatedChartData.turnovers.reduce(function(accumulator, currentVal) {
				return accumulator + currentVal;
			}) / aggregatedChartData.turnovers.length;
			avgTurnover = Math.trunc(avgTurnover);

			data.labels = aggregatedChartData.months;
			data.datasets = [];
			data.datasets[0] = {};
			data.datasets[0].label = "Sales per Month (Kč)";
			data.datasets[0].backgroundColor = 'rgba(255, 99, 132, 0.2)';
			data.datasets[0].borderColor = 'rgba(255, 99, 132, 1)';
			data.datasets[0].data = aggregatedChartData.turnovers;

			data.datasets[1] = {};
			data.datasets[1].label = "Average Monthly Sale (Kč)";
			data.datasets[1].pointRadius = 0;
			data.datasets[1].backgroundColor = 'rgba(0, 0, 0, 0)';
			data.datasets[1].borderColor = 'rgba(40, 50, 250, 0.2)';
			data.datasets[1].data = Array.from({length: aggregatedChartData.turnovers.length}, i => avgTurnover);

			var ctx = document.getElementById("totalSalesChart").getContext("2d");

			var myLineChart = new Chart(ctx, {
				type: 'line',
				data: data
			});
		}

		$scope.generateVSToCashSalesChart = function(aggregatedChartData) {
			$scope.totalNumberOfOrders = 0;
			var dataArrayVS = [];
			var dataArrayCash = [];
			var data = {};
			data.labels = Object.keys(aggregatedChartData).reverse();

			data.labels.forEach(function(label) {
				if (aggregatedChartData[label].turnover > 0) {
					dataArrayVS.push(aggregatedChartData[label].vsOrders.length);
					dataArrayCash.push(aggregatedChartData[label].cashOrders.length);
					$scope.totalNumberOfOrders += aggregatedChartData[label].vsOrders.length;
					$scope.totalNumberOfOrders += aggregatedChartData[label].cashOrders.length;
				} else {
					dataArrayVS.push(0);
					dataArrayCash.push(0);
					$scope.totalNumberOfOrders += 0;
					$scope.totalNumberOfOrders += 0;
				}
			});

			var newestLabel = data.labels[data.labels.length - 1];
			$scope.lastMonthOrders = aggregatedChartData[newestLabel].cashOrders.length + aggregatedChartData[newestLabel].vsOrders.length;
			$scope.averageNumberOfOrders = Math.round($scope.totalNumberOfOrders / Object.keys(aggregatedChartData).length);

			data.datasets = [];

			var dataset1 = {
				label: 'VS orders',
				backgroundColor: 'rgba(255, 99, 132, 0.2)',
				borderColor: 'rgba(0, 0, 0, 1)',
				borderWidth: 1,
				data: dataArrayVS
			}

			var dataset2 = {
				label: 'Cash orders',
				backgroundColor: 'rgba(40, 50, 250, 0.2)',
				borderColor: 'rgba(0, 0, 0, 1)',
				borderWidth: 1,
				data: dataArrayCash
			}

			data.datasets.push(dataset1);
			data.datasets.push(dataset2);

			var ctx = document.getElementById("vsCashSalesChart").getContext("2d");

			var myBarChart = new Chart(ctx, {
				type: 'bar',
				data: data,
				options: {
					scales: {
						xAxes: [{
							stacked: true
						}],
						yAxes: [{
							stacked: true
						}]
					}
				}
			});
		}

		medPharmaCharts.getProductsSales()
		.then(function(productSales) {
			$scope.allProductSales = productSales;
			return medPharmaOthers.getAllProductsJson()
		})
		.then(function(products) {
			$scope.allProductNames = Object.keys(products);
			$scope.allProductSalesChartData = $scope.mapAllProductSales($scope.allProductNames, $scope.allProductSales);
			$scope.generateProductSalesChart($scope.allProductSalesChartData);
			$scope.generateProductCountsChart($scope.allProductSalesChartData);
		})

		medPharmaSummaries.getAggregatedOrdersAndCosts()
		.then(function(aggregatedData) {
			return medPharmaSummaries.mapDataToSummary(aggregatedData.orders, aggregatedData.costs);
		})
		.then(function(mappedData) {
			$scope.totalCosts = mappedData.totalCosts;
			$scope.totalTurnover = mappedData.totalTurnover;
			$scope.totalDeliveryCosts = mappedData.totalDeliveryCosts;
			$scope.mappedSummary = mappedData.mappedSummary;
			$scope.allSalesData = $scope.mapTotalSales($scope.mappedSummary);
			$scope.generateTotalSalesChart($scope.allSalesData);
			$scope.generateVSToCashSalesChart($scope.mappedSummary);
		})
}]);