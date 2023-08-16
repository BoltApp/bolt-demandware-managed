'use strict';

var StoreMgr = require('dw/catalog/StoreMgr');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var Transaction = require('dw/system/Transaction');

/**
 * Sets the store and its inventory list for the given product line item.
 * @param {string} storeId - The store id
 * @param {dw.order.ProductLineItem} productLineItem - The ProductLineItem object
 */
function setStoreInProductLineItem(storeId, productLineItem) {
    Transaction.wrap(function () {
        if (storeId) {
            var store = StoreMgr.getStore(storeId);
            var inventoryListId = ('inventoryListId' in store.custom) ? store.custom.inventoryListId : null;
            if (store && inventoryListId) {
                var storeinventory = ProductInventoryMgr.getInventoryList(inventoryListId);
                if (storeinventory) {
                    if (storeinventory.getRecord(productLineItem.productID)
                    && storeinventory.getRecord(productLineItem.productID).ATS.value
                    >= productLineItem.quantityValue) {
                        productLineItem.custom.fromStoreId = store.ID; // eslint-disable-line
                        productLineItem.custom.pickUpInStore = true; // eslint-disable-line
                        // no-param-reassign
                        productLineItem.setProductInventoryList(storeinventory);
                    }
                }
            }
        }
    });
}

/**
 * Returns the available to sell value for the product at the specified store.
 * @param {Object} storeId - the store ID to lookup the inventory
 * @param {Object} productId - the product ID to lookup the inventory
 * @returns {number} - the available to sell value
 */
function getStoreInventory(storeId, productId) {
    var availableToSellValue = 0;

    var store = StoreMgr.getStore(storeId);
    var inventoryListId = ('inventoryListId' in store.custom) ? store.custom.inventoryListId : null;
    if (inventoryListId) {
        var storeInventory = ProductInventoryMgr.getInventoryList(inventoryListId);
        if (storeInventory && storeInventory.getRecord(productId)) {
            availableToSellValue = storeInventory.getRecord(productId).ATS.value;
        }
    }

    return availableToSellValue;
}

module.exports = {
    setStoreInProductLineItem: setStoreInProductLineItem,
    getStoreInventory: getStoreInventory
};
