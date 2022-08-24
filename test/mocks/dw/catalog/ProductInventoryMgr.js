var productInventoryMgr = {
  getInventoryList(inventoryListId) {
    var inventoryListId0001 = {
      getRecord(productID) {
        var product000001 = {
          ATS: { value: 10 },
        };

        var product000002 = {
          ATS: { value: 3 },
        };

        var product000003 = {
          ATS: { value: 5 },
        };

        if (productID === '000001') {
          return product000001;
        }
        if (productID === '000002') {
          return product000002;
        }
        if (productID === '000003') {
          return product000003;
        }

        return {};
      },
    };

    var inventoryListId0002 = {
      getRecord(productID) {
        var product000001 = {
          ATS: { value: 0 },
        };

        var product000002 = {
          ATS: { value: 8 },
        };

        var product000003 = {
          ATS: { value: 10 },
        };

        if (productID === '000001') {
          return product000001;
        }
        if (productID === '000002') {
          return product000002;
        }
        if (productID === '000003') {
          return product000003;
        }

        return {};
      },
    };

    var inventoryListId0003 = {
      getRecord(productID) {
        var product000001 = {
          ATS: { value: 10 },
        };

        var product000002 = {
          ATS: { value: 15 },
        };

        var product000003 = {
          ATS: { value: 8 },
        };

        if (productID === '000001') {
          return product000001;
        }
        if (productID === '000002') {
          return product000002;
        }
        if (productID === '000003') {
          return product000003;
        }

        return {};
      },
    };

    if (inventoryListId === 'inventoryListId0001') {
      return inventoryListId0001;
    }
    if (inventoryListId === 'inventoryListId0002') {
      return inventoryListId0002;
    }
    if (inventoryListId === 'inventoryListId0003') {
      return inventoryListId0003;
    }

    return {};
  },
};

module.exports = {
  getInventoryList: productInventoryMgr.getInventoryList,
};
