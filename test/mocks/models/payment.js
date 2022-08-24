var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var collections = require('../util/collections');

function proxyModel() {
  return proxyquire(
    '../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/models/payment',
    {
      '*/cartridge/scripts/util/collections': collections,
      'dw/order/PaymentMgr': {
        getApplicablePaymentMethods() {
          return [
            {
              ID: 'GIFT_CERTIFICATE',
              name: 'Gift Certificate',
            },
            {
              ID: 'CREDIT_CARD',
              name: 'Credit Card',
            },
          ];
        },
        getPaymentMethod() {
          return {
            getApplicablePaymentCards() {
              return [
                {
                  cardType: 'Visa',
                  name: 'Visa',
                  UUID: 'some UUID',
                },
                {
                  cardType: 'Amex',
                  name: 'American Express',
                  UUID: 'some UUID',
                },
                {
                  cardType: 'Master Card',
                  name: 'MasterCard',
                },
                {
                  cardType: 'Discover',
                  name: 'Discover',
                },
              ];
            },
          };
        },
        getApplicablePaymentCards() {
          return ['applicable payment cards'];
        },
      },
      'dw/order/PaymentInstrument': {},
    }
  );
}

module.exports = proxyModel();
