'use strict';

var server = require('server');

/* API Includes */
var BasketMgr = require('dw/order/BasketMgr');

/* Script Modules */
var BoltPreferences = require('int_bolt_core/cartridge/scripts/services/utils/preferences');
var UserSignature = require('int_bolt_core/cartridge/scripts/cart/userSignature');
var commonUtils = require('int_bolt_core/cartridge/scripts/utils/commonUtils');

/**
 *  Get basket ID since SFCC frontend doesn't expose it by default.
 *  Also adding user signatures in case user logged in
 */
server.get('GetOrderReference', server.middleware.https, function (req, res, next) {
    var configuration = BoltPreferences.getSitePreferences();
  var basketID, hints, dwsid; // eslint-disable-line

    if (configuration && configuration.boltEnableCartPage) {
        var basket = BasketMgr.getCurrentBasket();
        basketID = basket.getUUID();
        dwsid = commonUtils.getDwsidCookie();
        hints = UserSignature.getPrefillUserSignature();
        hints.fetch_cart_metadata = {
            SFCCSessionID: dwsid
        };
    }

    res.setStatusCode(200);
    res.json({
        basketID: basketID,
        dwsid: dwsid,
        hints: hints,
        config: configuration
    });
    next();
});

module.exports = server.exports();
