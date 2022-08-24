var ArrayList = require('../../dw.util.Collection');

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
    applicableShippingMethods: new ArrayList([
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
    ]),
    getApplicableShippingMethods() {
      return new ArrayList([
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
        {
          description: 'Ship to store shipping method',
          displayName: 'Ship to store',
          ID: 'ShipToStore',
          custom: {
            estimatedArrivalTime: '7-10 Business Days',
          },
        },
      ]);
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

function getProductShippingModel() {
  return {
    getShippingCost() {
      return {
        amount: {
          valueOrNull: 7.99,
        },
        getAmount() {
          return {
            amount: {
              valueOrNull: 7.99,
            },
          };
        },
        isSurcharge() {
          return true;
        },
      };
    },
  };
}

function getAllShippingMethods() {
  return [{ displayName: 'Ground' }];
}

module.exports = {
  getDefaultShippingMethod() {
    return defaultShippingMethod;
  },
  getShipmentShippingModel(shipment) {
    return createShipmentShippingModel(shipment);
  },
  getProductShippingModel,
  getAllShippingMethods,
};
