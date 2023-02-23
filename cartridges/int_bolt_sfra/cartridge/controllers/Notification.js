'use strict';

/* eslint-disable eqeqeq */
var server = require('server');

/* API Includes */
var Resource = require('dw/web/Resource');

/* Script Modules */
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var BoltHttpUtils = require('int_bolt_core/cartridge/scripts/services/utils/httpUtils');
var PaymentHelper = require('int_bolt_core/cartridge/scripts/checkout/paymentProcessor');

/**
 * Send Order confirmation email
 */
server.post('OrderConfirmEmail', server.middleware.https, function (req, res, next) {
    var ORDER_STATUS_NEW = dw.order.Order.ORDER_STATUS_NEW; // eslint-disable-line no-undef

    var ORDER_STATUS_OPEN = dw.order.Order.ORDER_STATUS_OPEN; // eslint-disable-line no-undef

    try {
        var errorMessage = '';

        if (!BoltHttpUtils.getAuthenticationStatus()) {
            errorMessage = Resource.msg('request.not.authenticated', 'error', null);
            BoltHttpUtils.respondError(res, errorMessage, 401);
            return next();
        }

        var requestBody = BoltHttpUtils.getBoltRequestBody();
        var orderID = requestBody.order_id;
        var order = dw.order.OrderMgr.getOrder(orderID); // eslint-disable-line no-undef

        if (order === null || order.getCustomerEmail() === null) {
            errorMessage = Resource.msg('order.or.email.notfound', 'error', null);
            BoltHttpUtils.respondError(res, errorMessage, 404);
            return next();
        }

        // Only pass orders in status 'new' and 'open'. Orders in other status should be ignored.
        if (order.status != ORDER_STATUS_NEW && order.status != ORDER_STATUS_OPEN) {
            errorMessage = Resource.msgf('order.status.incorrect', 'error', null, order.status);
            BoltHttpUtils.respondError(res, errorMessage, 406);
            return next();
        }

        if (order.customerEmail !== null) {
            COHelpers.sendConfirmationEmail(order, req.locale.id);
        }

        res.json({
            status: 'success'
        });
        return next();
    } catch (e) {
        BoltHttpUtils.respondError(res, e.message || '', 500);
        return next();
    }
});

/**
 * Set payment processor for alternative payment methods.
 */
server.post('APMProcessor', server.middleware.https, function (req, res, next) {
    try {
        if (!BoltHttpUtils.getAuthenticationStatus()) {
            var errorMessage = Resource.msg('request.not.authenticated', 'error', null);
            BoltHttpUtils.respondError(res, errorMessage, 401);
            return next();
        }

        var request = BoltHttpUtils.getBoltRequestBody();
        var status = PaymentHelper.setPaymentProcessor(request.order_id || '', request.processor);

        if (status.error) {
            BoltHttpUtils.respondError(res, status.message, 406);
            return next();
        }

        res.json({
            status: 'success'
        });
        return next();
    } catch (e) {
        BoltHttpUtils.respondError(res, e.message || '', 500);
        return next();
    }
});

module.exports = server.exports();
