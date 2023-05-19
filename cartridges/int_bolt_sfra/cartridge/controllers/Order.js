'use strict';

var server = require('server');
var Order = module.superModule;
server.extend(Order);

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
var OrderMgr = require('dw/order/OrderMgr');
var Locale = require('dw/util/Locale');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
var OrderModel = require('*/cartridge/models/order');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * Exclude order customer ID check for Bolt SSO, since order is assigned to new created account 
 * if shopper creates account during checkout.
 */
server.replace('Confirm',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {    
    var order;
    var boltEnableSSO = Site.getCurrent().getCustomPreferenceValue('boltEnableSSO');

    if (!req.form.orderToken || !req.form.orderID) {
        res.render('/error', {
            message: Resource.msg('error.confirmation.error', 'confirmation', null)
        });
        return next();
    }

    order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);

    if (!order || (!boltEnableSSO && order.customer.ID !== req.currentCustomer.raw.ID)) {
        res.render('/error', {
            message: Resource.msg('error.confirmation.error', 'confirmation', null)
        });

        return next();
    }
    var lastOrderID = Object.prototype.hasOwnProperty.call(req.session.raw.custom, 'orderID') ? req.session.raw.custom.orderID : null;
    if (lastOrderID === req.querystring.ID) {
        res.redirect(URLUtils.url('Home-Show'));
        return next();
    }

    var config = {
        numberOfLineItems: '*'
    };

    var currentLocale = Locale.getLocale(req.locale.id);

    var orderModel = new OrderModel(
        order,
        { config: config, countryCode: currentLocale.country, containerView: 'order' }
    );
    var passwordForm;

    var reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);

    if (!req.currentCustomer.profile) {
        passwordForm = server.forms.getForm('newPasswords');
        passwordForm.clear();
        res.render('checkout/confirmation/confirmation', {
            order: orderModel,
            returningCustomer: false,
            passwordForm: passwordForm,
            reportingURLs: reportingURLs,
            orderUUID: order.getUUID()
        });
    } else {
        res.render('checkout/confirmation/confirmation', {
            order: orderModel,
            returningCustomer: true,
            reportingURLs: reportingURLs,
            orderUUID: order.getUUID()
        });
    }
    req.session.raw.custom.orderID = req.querystring.ID; // eslint-disable-line no-param-reassign
    return next();
});

module.exports = server.exports();
