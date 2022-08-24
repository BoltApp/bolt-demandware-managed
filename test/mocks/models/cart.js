var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var TotalsModel = require('./totals');
var ProductLineItemsModel = require('./productLineItems');

var ShippingHelpers = require('../helpers/shippingHelpers');

var URLUtils = require('../dw.web.URLUtils');
var ArrayList = require('../dw.util.Collection');
var Money = require('../dw.value.Money');

function proxyModel() {
  return proxyquire('../../../cartridges/app_storefront_base/cartridge/models/cart', {
    '*/cartridge/scripts/util/collections': {},
    'dw/campaign/PromotionMgr': {
      getDiscounts() {
        return {
          getApproachingOrderDiscounts() {
            return new ArrayList([
              {
                getDistanceFromConditionThreshold() {
                  return new Money();
                },
                getDiscount() {
                  return {
                    getPromotion() {
                      return {
                        getCalloutMsg() {
                          return 'someString';
                        },
                      };
                    },
                  };
                },
              },
            ]);
          },
          getApproachingShippingDiscounts() {
            return new ArrayList([
              {
                getDistanceFromConditionThreshold() {
                  return new Money();
                },
                getDiscount() {
                  return {
                    getPromotion() {
                      return {
                        getCalloutMsg() {
                          return 'someString';
                        },
                      };
                    },
                  };
                },
              },
            ]);
          },
        };
      },
    },
    '*/cartridge/models/totals': TotalsModel,
    '*/cartridge/models/productLineItems': ProductLineItemsModel,
    '*/cartridge/scripts/checkout/shippingHelpers': ShippingHelpers,
    '*/cartridge/scripts/helpers/hooks': function () {
      return { error: false, message: 'some message' };
    },
    '*/cartridge/scripts/hooks/validateBasket': function () {},
    'dw/web/URLUtils': URLUtils,
    'dw/util/StringUtils': {
      formatMoney() {
        return 'formatted money';
      },
    },
    'dw/web/Resource': {
      msg() {
        return 'someString';
      },
      msgf() {
        return 'someString';
      },
    },
  });
}

module.exports = proxyModel();
