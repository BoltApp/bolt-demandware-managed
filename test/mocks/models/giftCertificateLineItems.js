var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var collections = require('../util/collections');

function proxyModel() {
  var formattedMoney = 10.0;
  return proxyquire('../../../src/cartridges/int_bolt_sfra/cartridge/models/giftCertificateLineItems', {
    '*/cartridge/scripts/util/collections': collections,
    'dw/util/StringUtils': {
      formatMoney() {
        return formattedMoney;
      },
    },
  });
}

module.exports = proxyModel();
