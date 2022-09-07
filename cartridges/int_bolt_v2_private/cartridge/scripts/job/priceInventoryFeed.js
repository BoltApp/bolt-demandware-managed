'use strict';

/* eslint-disable*/

/*
 * Generate price and inventory feed with products
 */

/* API Includes */
var File = require('dw/io/File');
var Site = require('dw/system/Site'); 

/* Script Modules */
var Constants = require('~/cartridge/scripts/utils/constants');
var JobUtils = require('~/cartridge/scripts/utils/jobUtils');

/* Constants */
var FEED_PATH = File.IMPEX + '/bolt_price_inventory_feed/';
var FEED_NAME = 'price-inventory-export';

/**
 * Export qualified products, generate catalog feed with timestamp.
 * @param {dw.util.Map} context job context
 * @returns {dw.system.Status} job status
 */
function initExport(context) {
  var ProcessHandler = require('~/cartridge/scripts/utils/jobHandler');

  var chunkSize = context.chunkSize !== null ? parseInt(context.chunkSize) : -1;
  var path = FEED_PATH;
  context.path = path;
  context.feedName = FEED_NAME;
  context.chunkSize = chunkSize;
  return ProcessHandler.process(context, shouldExport, getProductLine);
}

/**
 *  Check if data is qualified to export.
 *  @param {dw.catalog.Product} product product to check
 *  @param {dw.util.Map} context job context
 *  @returns {boolean} flag to export product
 */
function shouldExport(product, context) {
  var STANDARD_PRODUCT = Constants.PRODUCT_TYPE_STANDARD_PRODUCT;
  var VARIANT_PRODUCT = Constants.PRODUCT_TYPE_VARIANT_PRODUCT;
  var productType = JobUtils.getProductType(product);

  if (productType === STANDARD_PRODUCT || productType === VARIANT_PRODUCT) {
    return true;
  }

  return false;
}

/**
 * Get an array of product attributes.
 * @param {dw.catalog.Product} product product to process
 * @returns {Array} product line
 */
function getProductLine(product) {
  var productId = product.ID;
  var siteId = Site.current.ID;
  var productPrices = JobUtils.getPrices(product);
  var standardPrice = productPrices.standardPrice;
  var salePrice = productPrices.salePrice;
  var currency = productPrices.currencyCode;
  var productInventory = JobUtils.getInventory(product);
  var productData = {
    id: productId,
    price: standardPrice,
    sale_price: salePrice,
    currency: currency,
    inventory: productInventory.allocation,
    site_id: siteId
  };
  return productData;
}

exports.initExport = initExport;