'use strict';

var server = require('server');
var Order = module.superModule;
server.extend(Order);

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
var OrderMgr = require('dw/order/OrderMgr');
var Locale = require('dw/util/Locale');
var Transaction = require('dw/system/Transaction');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
var OrderModel = require('*/cartridge/models/order');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.replace(
    'Confirm',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var order;
        var boltEnableSSO = Site.getCurrent().getCustomPreferenceValue('boltEnableSSO');
        var boltEnablePPC = Site.getCurrent().getCustomPreferenceValue('boltEnablePPC');

        if (!req.form.orderToken || !req.form.orderID) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);

        // This is where different from the base cartridge, skip order customer check for SSO and PPC checkout.
        // SSO: If shopper check the checkbox to create an account during checkout, we set the order to the new created account but not login,
        // so the order customer id is different from the guest customer ID in the original request.
        // PPC: If shopper use product page checkout, orders customer ID will be different from the session customer ID
        if (!order || (!(boltEnableSSO || boltEnablePPC) && order.customer.ID !== req.currentCustomer.raw.ID)) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });

            return next();
        }

        // Link Order to loggedin SFCC customer when PPC is enabled
        if (boltEnablePPC) {
            var currentCustomer = req.currentCustomer.raw;
            if (currentCustomer.isAuthenticated() || currentCustomer.isExternallyAuthenticated()) {
                // get customer email and compare with order email
                var orderEmail = order.getCustomerEmail();
                var customerEmail = currentCustomer.getProfile().getEmail();
                if (orderEmail === customerEmail) {
                    Transaction.wrap(function () {
                        order.setCustomer(currentCustomer);
                    });
                }
            }
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
    }
);

module.exports = server.exports();
