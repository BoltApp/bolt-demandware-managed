var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var defaultShippingMethod = {
  description: 'Order received within 7-10 business days',
  displayName: 'Ground',
  ID: '001',
  custom: {
    estimatedArrivalTime: '7-10 Business Days',
  },
};

function createShipmentShippingModel() {
  return {
    applicableShippingMethods: [
      {
        description: 'Order received within 7-10 business days',
        displayName: 'Ground',
        ID: '001',
        custom: {
          estimatedArrivalTime: '7-10 Business Days',
        },
      },
      {
        description: 'Order received in 2 business days',
        displayName: '2-Day Express',
        ID: '002',
        shippingCost: '$0.00',
        custom: {
          estimatedArrivalTime: '2 Business Days',
        },
      },
    ],
    getApplicableShippingMethods() {
      return [
        {
          description: 'Order received within 7-10 business days',
          displayName: 'Ground',
          ID: '001',
          custom: {
            estimatedArrivalTime: '7-10 Business Days',
          },
        },
        {
          description: 'Order received in 2 business days',
          displayName: '2-Day Express',
          ID: '002',
          shippingCost: '$0.00',
          custom: {
            estimatedArrivalTime: '2 Business Days',
          },
        },
      ];
    },
    getShippingCost() {
      return {
        amount: {
          valueOrNull: 7.99,
        },
      };
    },
  };
}

function proxyModel() {
  return proxyquire(
    '../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/models/shipping/shippingMethod',
    {
      '*/cartridge/scripts/util/formatting': {
        formatCurrency() {
          return '$0.00';
        },
      },
      'dw/order/ShippingMgr': {
        getDefaultShippingMethod() {
          return defaultShippingMethod;
        },
        getShipmentShippingModel(shipment) {
          return createShipmentShippingModel(shipment);
        },
      },
    }
  );
}

module.exports = proxyModel();
