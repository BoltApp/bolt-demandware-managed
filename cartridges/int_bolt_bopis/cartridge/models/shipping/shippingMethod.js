'use strict';

var base = module.superModule;

/**
 * @constructor
 * @classdesc ShippingMethod class that represents a single shipping method
 *
 * @param {dw.order.ShippingMethod} shippingMethod - the default shipment of the current basket
 * @param {dw.order.Shipment} [shipment] - a Shipment
 */
function ShippingMethodModel(shippingMethod, shipment) {
    base.call(this, shippingMethod, shipment);
    this.storePickupEnabled = shippingMethod.custom
        && shippingMethod.custom.storePickupEnabled ? shippingMethod.custom.storePickupEnabled : false;
}

module.exports = ShippingMethodModel;
