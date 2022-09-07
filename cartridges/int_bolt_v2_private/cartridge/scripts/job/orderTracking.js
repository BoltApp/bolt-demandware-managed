'use strict';

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Status = require('dw/system/Status');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var HttpResult = require('dw/svc/Result');

/* Script Modules */
var orderTrackingHelper = require('~/cartridge/scripts/ordertracking/boltOrderTracking');
var LogUtils = require('int_bolt_v2/cartridge/scripts/utils/boltLogUtils');
var logger = LogUtils.getLogger('OrderTracking');

/* Constants */
// test tracking numbers provided by easypost
var TEST_TRACKING_NUMBERS = ['EZ1000000001', // pre_transit
    'EZ2000000002', // in_transit
    'EZ3000000003', // out_for_delivery
    'EZ4000000004' // delivered
];
var TEST_CARRIER = ['ups', 'usps', 'fedex', 'xpo'];
var DEFAULT_TOTAL_ORDERS = 4;

/**
 * Test bolt order tracking functionality using easypost test tracking numbers.
 * optional job parameters:
 * orderId: send tracking info for specific order
 * totalOrders: total number of orders to test
 * trackingNumber: real tracking number to overwrite TEST_TRACKING_NUMBERS
 * carrier: carrier to to overwrite TEST_CARRIER
 * @param {dw.util.Map} context job context
 * @returns {dw.system.Status} job status
 */
function orderTracking(context) {
    try {
        var orders, totalOrders; // eslint-disable-line

        // send tracking data for specific order if orderId is configured in job parameter
        if (context.orderId) {
            orders = [OrderMgr.getOrder(context.orderId)];
            totalOrders = 1;
        } else {
            orders = OrderMgr.searchOrders('(status={0} OR status={1}) AND custom.boltTransactionReference != NULL AND custom.isBoltOrder=true', 'creationDate desc', Order.ORDER_STATUS_OPEN, Order.ORDER_STATUS_NEW).asList().toArray();
            totalOrders = context.totalOrders ? context.totalOrders : DEFAULT_TOTAL_ORDERS;
        }

        var count = 0;
        orders.every(function (order) {
            if (count === totalOrders || order == null) {
                return false;
            }

            sendTrackingInfo(context, order, count);
            count++;
            return true;
        });

        if (count === 0) {
            logger.error('No qualified order found to send tracking info.');
            return new Status(Status.ERROR);
        }

        return new Status(Status.OK);
    } catch (e) {
        logger.error('Error occurs when sending order tracking information: ' + e);
        return new Status(Status.ERROR);
    }
}

/**
 * @param {dw.util.Map} context job context
 * @param {dw.order.Order} order - current order
 * @param {number} index - index used to get random test tracking number
 */
function sendTrackingInfo(context, order, index) {
    var productIds = [];
    var productLineItems = order.getAllProductLineItems().toArray();
    productLineItems.forEach(function (item) {
        productIds.push(item.product.ID);
    });
    var trackingNumber = TEST_TRACKING_NUMBERS[index % TEST_TRACKING_NUMBERS.length];

    if (order.getDefaultShipment().trackingNumber) {
        trackingNumber = order.getDefaultShipment().trackingNumber;
    } else if (context.trackingNumber) {
        trackingNumber = context.trackingNumber;
    }

    var carrier = context.carrier ? context.carrier : TEST_CARRIER[index % TEST_CARRIER.length];
    var response = orderTrackingHelper.boltOrderTracking(order.orderNo, trackingNumber, carrier, productIds);
    var msg = Resource.msgf('order.tracking.' + response.status, 'order', null, carrier, trackingNumber, order.orderNo); // set tracking number, bolt will return error if send a different tracking number for the same order

    if (response.status === HttpResult.OK) {
        Transaction.wrap(function () {
            order.getDefaultShipment().setTrackingNumber(trackingNumber);
        });
    }

    logger.info(msg);
}

exports.orderTracking = orderTracking;
