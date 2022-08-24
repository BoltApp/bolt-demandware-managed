var ArrayList = require('../../dw.util.Collection');

var store1 = {
  ID: 'Any ID',
  name: 'Downtown TV Shop',
  address1: '333 Washington St',
  address2: '',
  city: 'Boston',
  postalCode: '01803',
  phone: '333-333-3333',
  stateCode: 'MA',
  countryCode: {
    value: 'US',
  },
  latitude: 42.5273334,
  longitude: -71.13758250000001,
  storeHours: {
    markup: 'Mon - Sat: 10am - 9pm',
  },
  getAddress1() {
    return '333 Washington St';
  },
  getAddress2() {
    return 'Unit 1';
  },
  getPostalCode() {
    return '01803';
  },
};

var storeMgr = {
  searchStoresByPostalCode() {
    return {
      get() {
        return 1;
      },
      keySet() {
        return new ArrayList([
          {
            ...store1,
            custom: {
              shipToStoreEnabled: true,
            },
          },
        ]);
      },
    };
  },

  searchStoresByCoordinates() {
    return {
      keySet() {
        return [store1];
      },
    };
  },

  getStore() {
    return {
      getAddress1() {
        return 'address1';
      },
      getAddress2() {
        return 'address2';
      },
      getCountryCode() {
        return { value: 'US' };
      },
      getStateCode() {
        return 'CA';
      },
      getPostalCode() {
        return '12345';
      },
      getCity() {
        return 'San Francisco';
      },
      getPhone() {
        return '1234567890';
      },
      getName() {
        return 'StoreName';
      },
      ...store1,
    };
  },
};

module.exports = {
  searchStoresByPostalCode: storeMgr.searchStoresByPostalCode,
  searchStoresByCoordinates: storeMgr.searchStoresByCoordinates,
  getStore: storeMgr.getStore,
};
