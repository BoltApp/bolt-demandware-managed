var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
var templateStub = sinon.stub();
var StoreModel = require('../models/store');

var StoresModel = proxyquire('../../../cartridges/app_storefront_base/cartridge/models/stores', {
  '*/cartridge/models/store': StoreModel,
  'dw/util/HashMap': function () {
    return {
      result: {},
      put(key, context) {
        this.result[key] = context;
      },
    };
  },
  'dw/value/Money': function () {},
  'dw/util/Template': function () {
    return {
      render() {
        return { text: 'someString' };
      },
    };
  },
  '*/cartridge/scripts/renderTemplateHelper': {
    getRenderedHtml() {
      return 'someString';
    },
  },

  '*/cartridge/scripts/helpers/storeHelpers': {
    createStoresResultsHtml() {
      return 'someString';
    },
  },
});

var storeMgr = require('../dw/catalog/StoreMgr');

var site = {
  getCurrent() {
    return {
      getCustomPreferenceValue() {
        return 'SOME_API_KEY';
      },
    };
  },
};

var urlUtils = {
  url(endPointName) {
    return {
      toString() {
        return 'path-to-endpoint/' + endPointName;
      },
    };
  },
};

var productInventoryMgr = require('../dw/catalog/ProductInventoryMgr');

var hashMap = function () {
  return {
    result: {},
    put(key, context) {
      this.result[key] = context;
    },
  };
};

templateStub.returns({
  render() {
    return { text: 'rendered html' };
  },
});

function proxyModel() {
  return proxyquire('../../../cartridges/app_storefront_base/cartridge/scripts/helpers/storeHelpers', {
    '*/cartridge/models/store': StoreModel,
    '*/cartridge/models/stores': StoresModel,
    'dw/catalog/StoreMgr': storeMgr,
    'dw/system/Site': site,
    'dw/web/URLUtils': urlUtils,
    'dw/catalog/ProductInventoryMgr': productInventoryMgr,
    'dw/util/HashMap': hashMap,
    'dw/util/Template': templateStub,
  });
}

module.exports = proxyModel();
