"use strict";

var server = require('server');
/* API Includes */


var BasketMgr = require('dw/order/BasketMgr');
/* Script Modules */


var BoltPreferences = require('int_bolt_v2/cartridge/scripts/services/utils/preferences');

var UserSignature = require('int_bolt_v2/cartridge/scripts/cart/userSignature');
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
    dwsid = getDwsidCookie();
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
/**
 * Get dwsid cookie
 * @returns {string} dwsid cookie value
 */

function getDwsidCookie() {
  var cookies = request.getHttpCookies();

  for (var i = 0; i < cookies.cookieCount; i++) {
    if (cookies[i].name === 'dwsid') {
      return cookies[i].value;
    }
  }

  return '';
}

module.exports = server.exports();