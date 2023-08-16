'use strict';

var base = module.superModule;

var collections = require('*/cartridge/scripts/util/collections');
/**
 * Plain JS object that represents a DW Script API dw.order.ShippingMethod object
 * @param {dw.order.Shipment} shipment - the target Shipment
 * @param {Object} [address] - optional address object
 * @returns {dw.util.Collection} an array of ShippingModels
 */
function getApplicableShippingMethods(shipment, address) {
    var ShippingMgr = require('dw/order/ShippingMgr');
    var ShippingMethodModel = require('*/cartridge/models/shipping/shippingMethod');

    if (!shipment) return null;

    var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);

    var shippingMethods;
    if (address) {
        shippingMethods = shipmentShippingModel.getApplicableShippingMethods(address);
    } else {
        shippingMethods = shipmentShippingModel.getApplicableShippingMethods();
    }

    // Move Pickup in store method to the end of the list
    var pickupInstoreMethod = collections.find(shippingMethods, function (method) {
        return method.custom.storePickupEnabled;
    });
    if (pickupInstoreMethod) {
        shippingMethods.remove(pickupInstoreMethod);
        shippingMethods.add(pickupInstoreMethod);
    }

    return shippingMethods.toArray().map(function (shippingMethod) {
        return new ShippingMethodModel(shippingMethod, shipment);
    });
}

module.exports = {
    getApplicableShippingMethods: getApplicableShippingMethods
};
Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
