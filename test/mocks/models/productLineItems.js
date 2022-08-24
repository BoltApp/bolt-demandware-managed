var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var collections = require('../util/collections');

function proxyModel() {
  return proxyquire(
    '../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/models/productLineItems',
    {
      '*/cartridge/scripts/util/collections': collections,
      '*/cartridge/scripts/factories/product': {
        get() {
          return { bonusProducts: null, bonusProductLineItemUUID: null };
        },
      },
      'dw/web/URLUtils': {
        staticURL() {
          return '/images/noimagelarge.png';
        },
      },
      'dw/web/Resource': {
        msgf(param1) {
          return param1;
        },
      },
    }
  );
}

module.exports = proxyModel();
