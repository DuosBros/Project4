

var Q = require('q');

var ZaslatHandler = require('../handlers/zaslat-api.js').Handler;
var zaslatHandler;

Handler = function(app) {
    handler = this;

    zaslatHandler = new ZaslatHandler(app);
};

Handler.prototype.getNotPaidNotifications = function() {

    var deferred = Q.defer();

    var checkedDate = new Date();
    checkedDate.setDate(checkedDate.getDate() - 14);

    var result = [];

    var allShipments = {};

    var getShipmentsPromises = [];
    getShipmentsPromises.push(zaslatHandler.getAllShipments());
    getShipmentsPromises.push(zaslatHandler.getAllShipments(100));
    getShipmentsPromises.push(zaslatHandler.getAllShipments(200));

    Q.all(getShipmentsPromises)
    .then(function(shipments) {
        allShipments = Object.assign(allShipments, shipments[0], shipments[1], shipments[2]);

        return zaslatHandler.getAllZaslatOrders();
    })
    .then(function(zaslatOrders) {
        for (var i = 0; i < zaslatOrders.length; i++) {
            var zaslatOrder = zaslatOrders[i];
            if (!zaslatOrder.payment.paymentDate) {
                if (allShipments[zaslatOrder.zaslatShipmentId]) {
                    var deliveryDate = new Date(allShipments[zaslatOrder.zaslatShipmentId].delivery_date);
                    if (deliveryDate < checkedDate) {
                        var notificationItem = {
                            vs: zaslatOrder.payment.vs,
                            deliveryDate: deliveryDate,
                            threshold: checkedDate
                        }
                        result.push(notificationItem);
                    }
                }
            }
        }

        deferred.resolve(result);
    });

    return deferred.promise;
}

exports.Handler = Handler;