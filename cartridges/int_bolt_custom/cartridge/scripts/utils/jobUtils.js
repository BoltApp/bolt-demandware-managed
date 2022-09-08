'use strict';

/*
 * Job helper functions
 */

/* Script Includes */
var Constants = require('~/cartridge/scripts/utils/constants');

/**
 * Get product standard price, sales price and currency.
 * @param {dw.catalog.Product} product product to process
 * @returns {Object} product price
 */
function getPrices(product) {
    var prices = {
        standardPrice: '',
        salePrice: '',
        currencyCode: ''
    };

    if (product == null || product.isMaster()) {
        return prices;
    }

    var productToGetPrice = product;
    var priceModel = productToGetPrice.getPriceModel();

    if (priceModel == null || !priceModel.getPrice().available) {
        return prices;
    }

    var salePrice = '';
    var standardPrice = '';

    if (priceModel.getPrice().available && !empty(priceModel.getPrice().value)) {
        salePrice = priceModel.getPrice().toNumberString();
        prices.currencyCode = priceModel.getPrice().currencyCode;
    }

    var priceBook = priceModel.priceInfo.priceBook;

    while (priceBook.parentPriceBook) {
        priceBook = priceBook.parentPriceBook;
    }

    var priceBookPrice = priceModel.getPriceBookPrice(priceBook.ID);

    if (priceBookPrice.available && !empty(priceBookPrice.value)) {
        prices.currencyCode = priceBookPrice.currencyCode;
        standardPrice = priceBookPrice.toNumberString();
    }

    if (salePrice.equals(standardPrice)) {
        salePrice = '';
    }

    prices.standardPrice = standardPrice;
    prices.salePrice = salePrice;
    return prices;
}

/**
 * Get product inventory.
 * @param {dw.catalog.Product} product product to process
 * @returns {Object} product inventory object with ATS, allocation and availability status (PREORDER, BACKORDER, IN_STOCK, NOT_AVAILABLE)
 */
function getInventory(product) {
    var productAvailabilityModel = product.getAvailabilityModel();
    var inventoryRecord = productAvailabilityModel.inventoryRecord;
    var productInventory = {};

    if (product.isMaster()) {
        productInventory.ATS = 0;
        productInventory.allocation = 0;
        product.variants.toArray().forEach(function (variant) {
            inventoryRecord = variant.getAvailabilityModel().inventoryRecord;
            productInventory.ATS += empty(inventoryRecord) || empty(inventoryRecord.ATS) ? 0 : inventoryRecord.ATS.value;
            productInventory.allocation += empty(inventoryRecord) || empty(inventoryRecord.allocation) ? 0 : inventoryRecord.allocation.value;
        });
    } else {
        productInventory.ATS = empty(inventoryRecord) || empty(inventoryRecord.ATS) ? 0 : inventoryRecord.ATS.value;
        productInventory.allocation = empty(inventoryRecord) || empty(inventoryRecord.allocation) ? 0 : inventoryRecord.allocation.value;
    }

    productInventory.availabilityStatus = productAvailabilityModel.getAvailabilityStatus();
    return productInventory;
}

/**
 * Get product types: standard, master, variant, variation group, product set, product bundle
 * @param {dw.catalog.Product} product product to process
 * @returns {string} product type
 */
function getProductType(product) {
    var type = Constants.PRODUCT_TYPE_STANDARD_PRODUCT;

    if (product.isVariant()) {
        type = Constants.PRODUCT_TYPE_VARIANT_PRODUCT;
    } else if (product.isMaster()) {
        type = Constants.PRODUCT_TYPE_MASTER_PRODUCT;
    } else if (product.isVariationGroup()) {
        type = Constants.PRODUCT_TYPE_VARIATION_GROUP;
    } else if (product.isProductSet()) {
        type = Constants.PRODUCT_TYPE_PRODUCT_SET;
    } else if (product.isBundle()) {
        type = Constants.PRODUCT_TYPE_PRODUCT_BUNDLE;
    }

    return type;
}

exports.getProductType = getProductType;
exports.getPrices = getPrices;
exports.getInventory = getInventory;
