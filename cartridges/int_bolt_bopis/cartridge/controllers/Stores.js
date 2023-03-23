'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
var instorePUstoreHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
server.extend(module.superModule);

server.get('GetStoreById', server.middleware.include, cache.applyDefaultCache, function (req, res, next) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var StoreModel = require('*/cartridge/models/store');
    var storeId = req.querystring.storeId ? req.querystring.storeId : '';
    var storeObject = StoreMgr.getStore(storeId);
    var store = new StoreModel(storeObject);
    res.render('store/storeDetails', store);
    next();
});

server.get('GetStoreByCoords', function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var productId = req.querystring.pid;
    var latitude = req.querystring.latitude;
    var longitude = req.querystring.longitude;
    var url = null;
    var products = buildProductListAsJson(productId + ':1');
    var storesModel = storeHelpers.getStores(15, '', latitude, longitude, req.geolocation, false, url, products);
    var storesLen = storesModel.stores.length;
    while (storesLen--) {
        var storeId = storesModel.stores[storesLen].ID;
        var instoreInventory = instorePUstoreHelpers.getStoreInventory(storeId, productId);
        if (!instoreInventory) {
            storesModel.stores.splice(storesLen, 1);
        }
    }
    var storeResult = {};
    if (storesModel.stores.length > 0) {
        storeResult.storeHtml = renderTemplateHelper.getRenderedHtml(storesModel.stores[0], 'store/storeDetails');
        storeResult.storeId = storesModel.stores[0].ID;
    }
    res.json(storeResult);
    next();
});

server.get('GetMySelectedStore', function (req, res, next) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var StoreModel = require('*/cartridge/models/store');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var productId = req.querystring.pid;
    var storeId = req.querystring.storeId;
    var storeObject = StoreMgr.getStore(storeId);
    var instoreInventory = instorePUstoreHelpers.getStoreInventory(storeId, productId);
    var storeResult = {};
    if (!!instoreInventory) { // eslint-disable-line no-extra-boolean-cast
        var store = new StoreModel(storeObject);
        storeResult.storeHtml = renderTemplateHelper.getRenderedHtml(store, 'store/storeDetails');
    } else {
        var Resource = require('dw/web/Resource');
        storeResult.infoSelectForStock = Resource.msg('label.ats.notavailable', 'instorePickup', null);
    }
    res.json(storeResult);
    next();
});

/**
 *
 * @param {string} products - list of product details info in the form of "productId:quantity,productId:quantity,... "
 * @returns {Object} a object containing product ID and quantity
 */
function buildProductListAsJson(products) {
    if (!products) {
        return null;
    }

    return products.split(',').map(function (item) {
        var properties = item.split(':');
        return { id: properties[0], quantity: properties[1] };
    });
}

server.get('InventorySearch', cache.applyDefaultCache, function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var URLUtils = require('dw/web/URLUtils');

    var radius = req.querystring.radius;
    var postalCode = req.querystring.postalCode;
    var lat = req.querystring.lat;
    var long = req.querystring.long;
    var showMap = req.querystring.showMap || false;
    var horizontalView = req.querystring.horizontalView || false;
    var isForm = req.querystring.isForm || false;

    var products = buildProductListAsJson(req.querystring.products);

    var url = URLUtils.url('Stores-FindStores', 'showMap', showMap, 'products', req.querystring.products).toString();
    var storesModel = storeHelpers.getStores(radius, postalCode, lat, long, req.geolocation, showMap, url, products);

    var viewData = {
        stores: storesModel,
        horizontalView: horizontalView,
        isForm: isForm,
        showMap: showMap
    };

    var storesResultsHtml = storesModel.stores
        ? renderTemplateHelper.getRenderedHtml(viewData, 'storeLocator/storeLocatorNoDecorator')
        : null;

    storesModel.storesResultsHtml = storesResultsHtml;
    res.json(storesModel);
    next();
});

// The req parameter in the unnamed callback function is a local instance of the request object.
// The req parameter has a property called querystring. In this use case the querystring could
// have the following:
// lat - The latitude of the users position.
// long - The longitude of the users position.
// radius - The radius that the user selected to refine the search
// or
// postalCode - The postal code that the user used to search.
// radius - The radius that the user selected to refine the search
server.replace('FindStores', function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var radius = req.querystring.radius;
    var postalCode = req.querystring.postalCode;
    var lat = req.querystring.lat;
    var long = req.querystring.long;
    var showMap = req.querystring.showMap || false;
    var horizontalView = req.querystring.horizontalView || false;
    var isForm = req.querystring.isForm || false;

    var url = null;
    var products = buildProductListAsJson(req.querystring.products);

    var storesModel = storeHelpers.getStores(radius, postalCode, lat, long, req.geolocation, showMap, url, products);

    if (products) {
        var context = {
            stores: storesModel,
            horizontalView: horizontalView,
            isForm: isForm,
            showMap: showMap
        };

        var storesLen = storesModel.stores.length;
        while (storesLen--) {
            var storeId = storesModel.stores[storesLen].ID;
            var instoreInventory = instorePUstoreHelpers.getStoreInventory(storeId, products[0].id);
            if (!instoreInventory) {
                storesModel.stores.splice(storesLen, 1);
            }
        }

        var storesResultsHtml = storesModel.stores
            ? renderTemplateHelper.getRenderedHtml(context, 'storeLocator/storeLocatorResults')
            : null;

        storesModel.storesResultsHtml = storesResultsHtml;
    }

    res.json(storesModel);
    next();
});

server.get('getAtsValue', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var ProductMgr = require('dw/catalog/ProductMgr');

    var productId = req.querystring.pid;
    var storeId = req.querystring.storeId;

    var instoreInventory = instorePUstoreHelpers.getStoreInventory(storeId, productId);
    var product = ProductMgr.getProduct(productId);
    var availableForInStorePickup = product.custom
        && product.custom.availableForInStorePickup
        ? product.custom.availableForInStorePickup
        : false;

    var productAtsValue = {
        atsValue: instoreInventory,
        product: {
            available: !!instoreInventory,
            readyToOrder: !!instoreInventory,
            availableForInStorePickup: availableForInStorePickup,
            messages: [
                Resource.msg('label.instock', 'common', null)
            ]
        },
        resources: {
            info_selectforstock: Resource.msg('label.ats.notavailable', 'instorePickup', null)
        }
    };

    res.json(productAtsValue);
    next();
});

module.exports = server.exports();
