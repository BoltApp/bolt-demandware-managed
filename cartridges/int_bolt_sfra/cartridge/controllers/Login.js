'use strict';
var server = require('server');
var Login = module.superModule;
server.extend(Login);

/* API Includes */
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var LogUtils = require('int_bolt_core/cartridge/scripts/utils/boltLogUtils');
var OAuthUtils = require('int_bolt_core/cartridge/scripts/utils/oauthUtils');
var log = LogUtils.getLogger('Login');

server.get('OAuthRedirectBolt', function (req, res, next) {
    var boltParam = request.getHttpParameterMap();
    var { code, scope, state, reference, display_id: displayId, order_uuid: orderUUID } = boltParam;
    if (!code.value || !scope.value || !state.value) {
        log.error('Missing required parameter in request form: ' + LogUtils.maskCustomerData(req));
        return renderError(res, next);
    }

    var output = OAuthUtils.oauthLoginOrCreatePlatformAccount(code, scope, displayId, orderUUID);
    if (output.status === 'failure') {
        if (output.ignoreError) { // if ignore error, don't show error page.
            return next();
        }
        log.error(output.message);
        renderError(res, next);
    }

    // if shopper creates the account during checkout, set order reference to cache to
    // update the dwsid in the Bolt dynamo db, since dwsid changed after login.
    if (reference.value) {
        req.session.privacyCache.set('orderId', reference.value);
    }

    // optional: this is to support any customized post-login actions and redirect url override
    let data = {
        redirectUrl: URLUtils.url('Account-Show'),
        isRegistration: output.isRegistration,
        additionalData: output.additionalData,
        email: output.email,
    };
    data = OAuthUtils.process(req, res, data);

    res.redirect(data.redirectUrl);
    return next();
});

/**
 * Renders the error page.
 * @param {Object} res - the response object
 * @param {any} next - the next() function
 * @returns {any} result - will call next()
 */
function renderError(res, next) {
    res.render('/error', {
      message: Resource.msg('error.oauth.login.failure', 'login', null),
    });
    return next(); 
}

module.exports = server.exports();
