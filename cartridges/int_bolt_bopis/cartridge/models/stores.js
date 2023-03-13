'use strict';

var base = module.superModule;

/**
 * Adding the store inventory list to an existing list of current stores.
 * @param {Array} currentStores - an array of objects that contains store information
 * @param {dw.util.Set} apiStores - a set of <dw.catalog.Store> objects
 * @returns {currentStores} an array of objects that contains store information
 */
function addInventroyList(currentStores, apiStores) {
    Object.keys(apiStores).forEach(function (key) {
        var apiStore = apiStores[key];
        currentStores.forEach(function (store) {
            if (apiStore.ID === store.ID) {
                if (apiStore.inventoryListID ||
                    (apiStore.custom && apiStore.custom.inventoryListId)) {
                    store.inventoryListId = apiStore.inventoryListID ||   // eslint-disable-line
                                            apiStore.custom.inventoryListId;
                }
            }
        });
    });
    return currentStores;
}

/**
 * @constructor
 * @classdesc The stores model
 * @param {dw.util.Set} storesResultsObject - a set of <dw.catalog.Store> objects
 * @param {Object} searchKey - what the user searched by (location or postal code)
 * @param {number} searchRadius - the radius used in the search
 * @param {dw.web.URL} actionUrl - a relative url
 * @param {string} apiKey - the google maps api key that is set in site preferences
 * @param {boolean} showMap - boolean to show map
 */
function stores(storesResultsObject, searchKey, searchRadius, actionUrl, apiKey, showMap) {
    base.call(this, storesResultsObject, searchKey, searchRadius, actionUrl, apiKey, showMap);
    this.stores = addInventroyList(this.stores, storesResultsObject);
}

stores.prototype = Object.create(base.prototype);

module.exports = stores;
