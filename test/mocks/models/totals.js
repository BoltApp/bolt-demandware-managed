var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Money = require('../dw.value.Money');

function proxyModel() {
  return proxyquire(
    '../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/models/totals',
    {
      'dw/util/StringUtils': {
        formatMoney() {
          return 'formatted money';
        },
      },
      'dw/value/Money': Money,
      'dw/util/Template': function () {
        return {
          render() {
            return { text: 'someString' };
          },
        };
      },
      'dw/util/HashMap': function () {
        return {
          result: {},
          put(key, context) {
            this.result[key] = context;
          },
        };
      },
      '*/cartridge/scripts/util/collections': require('../util/collections'),
    }
  );
}

module.exports = proxyModel();
