const server = require('server');
const Account = module.superModule;
server.extend(Account);

var Site = require('dw/system/Site');
var HttpResult = require('dw/svc/Result');

var CommonUtils = require('int_bolt_core/cartridge/scripts/utils/commonUtils');
var BoltHttpUtils = require('int_bolt_core/cartridge/scripts/services/utils/httpUtils');
var LogUtils = require('int_bolt_core/cartridge/scripts/utils/boltLogUtils');
var log = LogUtils.getLogger('Login');

// for SSO login during checkout, update dwsid in Bolt db.
server.prepend('Show', function (req, res, next) {
  const boltOrderId = req.session.privacyCache.store.boltOrderId;

  if (boltOrderId) {
    const dwsid = CommonUtils.getDwsidCookie();
    putSFCCObject(boltOrderId);
  }

  return next();
});

/**
 * Communicates with Bolt Endpoint to put the SFCC object
 * @param {string} boltOrderId -  Bolt order id
 */
function putSFCCObject (boltOrderId) {
    const endpoint = '/sfcc_objects';
    var dwsid = CommonUtils.getDwsidCookie();
    var boltMultiPublishableKey = Site.getCurrent().getCustomPreferenceValue('boltMultiPublishableKeyOCAPI') || '';
    var publishableKeySplit = boltMultiPublishableKey.split('.');
    var publishableKey = publishableKeySplit[publishableKeySplit.length - 1]
  
    const request = {
      publishable_key: publishableKey,
      session_id: dwsid,
      order_id: boltOrderId,
    };
  
    var serviceResponse = BoltHttpUtils.restAPIClient('POST', endpoint, JSON.stringify(request), '', '');
    if (!serviceResponse || serviceResponse.status == HttpResult.ERROR) {
        log.error('Failed to update dwsid to Bolt')
    }
    return;
}

module.exports = server.exports();
