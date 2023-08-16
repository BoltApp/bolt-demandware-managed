'use strict';

var base = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');
var URLUtils = require('dw/web/URLUtils');

/**
 * @constructor
 * @classdesc Model that represents shipping information
 *
 * @param {dw.order.Shipment} shipment - the default shipment of the current basket
 * @param {Object} address - the address to use to filter the shipping method list
 * @param {Object} customer - the current customer model
 * @param {string} containerView - the view of the product line items (order or basket)
 */
function ShippingModel(shipment) {
    base.apply(this, arguments);
    var products = collections.map(shipment.productLineItems, function (item) {
        var productItem = item.product ? item.product.ID : item.productID;
        return productItem + ':' + item.quantity.value;
    }).join(',');
    this.pickupInstoreUrl = URLUtils.url('Stores-InventorySearch', 'showMap', false, 'products', products, 'isForm', false).toString();
}

module.exports = ShippingModel;
