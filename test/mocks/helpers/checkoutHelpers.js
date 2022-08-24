var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var collections = require('../util/collections');
var addressModel = require('../models/address');
var orderModel = require('../models/order');

var renderTemplateHelper = require('./renderTemplateHelper');
var shippingHelpers = require('./shippingHelpers');
var basketMgr = require('../dw/order/BasketMgr');

var server = {
  forms: {
    getForm(formName) {
      return {
        formName,
        clear() {},
      };
    },
  },
};

var transaction = {
  wrap(callBack) {
    return callBack.call();
  },
  begin() {},
  commit() {},
};

var hookMgr = {
  callHook() {},
};

var resource = {
  msg(param1) {
    return param1;
  },
};

var status = {
  OK: 0,
  ERROR: 1,
};

var orderMgr = {
  createOrder() {
    return { order: 'new order' };
  },
  placeOrder() {
    return status.OK;
  },
  failOrder() {
    return { order: 'failed order' };
  },
};

var order = {
  CONFIRMATION_STATUS_NOTCONFIRMED: 'ONFIRMATION_STATUS_NOTCONFIRMED',
  CONFIRMATION_STATUS_CONFIRMED: 'CONFIRMATION_STATUS_CONFIRMED',
  EXPORT_STATUS_READY: 'order export status is ready',
};

function proxyModel() {
  return proxyquire(
    '../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/checkout/checkoutHelpers',
    {
      server,
      '*/cartridge/scripts/util/collections': collections,
      '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals() {} },

      'dw/order/BasketMgr': basketMgr,
      'dw/util/HashMap': {},
      'dw/system/HookMgr': hookMgr,
      'dw/net/Mail': {},
      'dw/order/OrderMgr': orderMgr,
      'dw/order/PaymentInstrument': {},
      'dw/order/PaymentMgr': {},
      'dw/order/Order': order,
      'dw/system/Status': status,
      'dw/web/Resource': resource,
      'dw/system/Site': {},
      'dw/util/Template': {},
      'dw/system/Transaction': transaction,

      '*/cartridge/models/address': addressModel,
      '*/cartridge/models/order': orderModel,

      '*/cartridge/scripts/renderTemplateHelper': renderTemplateHelper,
      '*/cartridge/scripts/checkout/shippingHelpers': shippingHelpers,
      '*/cartridge/scripts/formErrors': require('../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/formErrors'),
    }
  );
}

module.exports = proxyModel();
