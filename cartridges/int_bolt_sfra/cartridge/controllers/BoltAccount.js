'use strict';

var server = require('server');

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var CustomerMgr = require('dw/customer/CustomerMgr');
var StringUtils = require('dw/util/StringUtils');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');

/* Script Modules */
var BoltHttpUtils = require('int_bolt_core/cartridge/scripts/services/utils/httpUtils');

/**
 * Set order to the customer if the customer account is created during checkout.
 */
server.post('SetOrderCustomer', server.middleware.https, function (req, res, next) {
    try {
        var errorMessage;
        if (!BoltHttpUtils.getAuthenticationStatus()) {
            errorMessage = Resource.msg('request.not.authenticated', 'error', null);
            BoltHttpUtils.respondError(res, errorMessage, 401);
            return next();
        }

        var requestBody = BoltHttpUtils.getBoltRequestBody();
        var orderID = requestBody.order_id;
        var orderUUID = requestBody.order_uuid;
        var customerNo = requestBody.customer_no;

        if (empty(orderID) || empty(orderUUID) || empty(customerNo)) {
            errorMessage = StringUtils.format('Missing {0}{1}{2}in the request body.', empty(orderID) ? 'order ID ' : '', empty(orderUUID) ? 'order UUID ' : '', empty(customerNo) ? 'customer number ' : '');
            BoltHttpUtils.respondError(res, errorMessage, 400);
            return next();
        }

        var order = OrderMgr.getOrder(orderID);
        var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);

        // For safety, set order customer only if the order UUID and order email matches.
        if (order && order.getUUID() === orderUUID && order.getCustomerEmail() === customer.profile.email) {
            Transaction.wrap(function () {
                order.setCustomer(customer);
            });
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