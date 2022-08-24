"use strict";

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');

var Resource = require('dw/web/Resource');

var HttpResult = require('dw/svc/Result');
/* Script Includes */


var BoltHttpUtils = require('int_bolt_v2/cartridge/scripts/services/utils/httpUtils');

var LogUtils = require('int_bolt_v2/cartridge/scripts/utils/boltLogUtils');

var Constants = require('~/cartridge/scripts/utils/constants');

var log = LogUtils.getLogger('OrderTracking');
/**
 * @typedef {Object} OrderTrackingResponse
 * @property {string} status - 'OK' | 'ERROR'.
 * @property {Error[]} errors - list of errors.
 */

/**
 * Send tracking information to Bolt.
 * @param {string} orderID - order ID
 * @param {string} trackingNumber - tracking number
 * @param {string} trackingCarrier - tracking carrier name
 * @param {Array} productIds - array of products ID in this shipment
 * @returns {OrderTrackingResponse} order tracking response
 */

function boltOrderTracking(orderID, trackingNumber, trackingCarrier, productIds) {
  var order = OrderMgr.getOrder(orderID);

  if (empty(order)) {
    var errorMessage = Resource.msg('order.not.found', 'error', null);
    log.error(errorMessage);
    return {
      status: HttpResult.ERROR,
      errors: [new Error(errorMessage)]
    };
  }

  var shippingItems = [];
  productIds.forEach(function (id) {
    shippingItems.push({
      reference: id
    });
  });
  var request = {
    transaction_reference: order.custom.boltTransactionReference,
    tracking_number: trackingNumber,
    carrier: trackingCarrier,
    items: shippingItems,
    is_non_bolt_order: false
  };
  var response = BoltHttpUtils.restAPIClient(BoltHttpUtils.HTTP_METHOD_POST, Constants.ORDER_TRACKING_URL, JSON.stringify(request));

  if (response.status && response.status === HttpResult.ERROR) {
    log.error('Failed to send order tracking data to Bolt, error: ' + (!empty(response.errors) && !empty(response.errors[0].message) ? response.errors[0].message : ''));
    return {
      status: HttpResult.ERROR,
      errors: response.errors
    };
  }

  return {
    status: HttpResult.OK,
    errors: null
  };
}

exports.boltOrderTracking = boltOrderTracking;