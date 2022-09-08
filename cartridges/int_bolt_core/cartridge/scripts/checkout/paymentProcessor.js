'use strict';

/* API Includes */
var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');

/* Script Includes */
var LogUtils = require('~/cartridge/scripts/utils/boltLogUtils');
var log = LogUtils.getLogger('Payment');

/**
 * Set payment processor in order
 * @param {string} orderNo - order number
 * @param {string} paymentProcessorID - payment processor id
 * @returns {dw.system.Status} return status to indicate if success or not
 */
exports.setPaymentProcessor = function (orderNo, paymentProcessorID) {
    try {
        var order = OrderMgr.getOrder(orderNo);

        if (empty(order)) {
            var errorMessage = 'Order is not found.';
            return new Status(Status.ERROR, errorMessage);
        }

        var paymentProcessorIDFormatted = paymentProcessorID.charAt(0).toUpperCase() + paymentProcessorID.slice(1);
        var paymentMethod = PaymentMgr.getPaymentMethod(paymentProcessorIDFormatted);

        if (!empty(paymentMethod)) {
            Transaction.wrap(function () {
                var paymentProcessor = paymentMethod.getPaymentProcessor();
                order.paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
            });
        }

        return new Status(Status.OK);
    } catch (e) {
        log.error(e);
        return new Status(Status.ERROR, e.message);
    }
};
