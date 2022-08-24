"use strict";

/* eslint-disable*/

/*
 * Generate catalog feed with products
 */
// API Includes
var File = require('dw/io/File');

var URLUtils = require('dw/web/URLUtils');

var StringUtils = require('dw/util/StringUtils');

var Calendar = require('dw/util/Calendar');

var System = require('dw/system/System');

var Site = require('dw/system/Site');

var CustomObjectMgr = require('dw/object/CustomObjectMgr'); // Script Includes


var Constants = require('~/cartridge/scripts/utils/constants');

var JobUtils = require('~/cartridge/scripts/utils/jobUtils');
/* Constants */


var COCHECKPOINT = 'BoltExportCheckPoint';
var COCHECKPOINT_PRODUCT_ID = 'ProductExport';
var FULL_EXPORT_PATH = File.IMPEX + '/periodic_catalog/full/';
var DELTA_EXPORT_PATH = File.IMPEX + '/periodic_catalog/delta/';
var FEED_NAME = 'catalog-export';
/**
 * Export qualified products, generate catalog feed with timestamp.
 * @param {dw.util.Map} context job context
 * @returns {dw.system.Status} job status
 */

function initExport(context) {
  var ProcessHandler = require('~/cartridge/scripts/utils/jobHandler');

  var productCheckpoint = CustomObjectMgr.getCustomObject(COCHECKPOINT, COCHECKPOINT_PRODUCT_ID);
  var productCheckpointNotFound = productCheckpoint === null;
  var chunkSize = context.chunkSize !== null ? parseInt(context.chunkSize) : -1;
  var path;

  if (productCheckpointNotFound || productCheckpoint.custom.lastJobRun === null) {
    path = FULL_EXPORT_PATH;
  } else {
    path = DELTA_EXPORT_PATH;
  }

  context.path = path;
  context.feedName = FEED_NAME;
  context.productCheckpoint = productCheckpoint;
  context.chunkSize = chunkSize;
  return ProcessHandler.process(context, shouldExport, getProductLine);
}
/**
 *  Check if product is qualified to export.
 *  Optional Job Params:
 *  includeMasterProduct : Include master products flag
 *  includeVariationGroup : Include variation group products flag
 *  includeProductSet : Include product set flag
 *  includeProductBundle : Include product bundle flag
 *  @param {dw.catalog.Product} product product to check
 *  @param {dw.util.Map} context job context
 *  @returns {boolean} flag to export product
 */


function shouldExport(product, context) {
  var STANDARD_PRODUCT = Constants.PRODUCT_TYPE_STANDARD_PRODUCT;
  var MASTER_PRODUCT = Constants.PRODUCT_TYPE_MASTER_PRODUCT;
  var BUNDLE_PRODUCT = Constants.PRODUCT_TYPE_PRODUCT_BUNDLE;
  var productCheckpoint = context.productCheckpoint;
  var updatedSinceLastRun = empty(productCheckpoint) || empty(productCheckpoint.custom.lastJobRun) ? true : product.getLastModified() > productCheckpoint.custom.lastJobRun;
  var productType = JobUtils.getProductType(product);
  var isValidProduct = false;

  if (productType === STANDARD_PRODUCT || productType === MASTER_PRODUCT || productType === BUNDLE_PRODUCT) {
    isValidProduct = true;
  }

  return isValidProduct && updatedSinceLastRun;
}
/**
 * Get an array of product attributes.
 * @param {dw.catalog.Product} product product to process
 * @returns {Array} product line
 */


function getProductLine(product) {
  var productLineData = getProductData(product);

  if (product.variants.length > 0) {
    productLineData.variants = [];
    product.variants.toArray().forEach(function (variant) {
      var variantLineData = getProductData(variant);
      variantLineData.master_product_id = productLineData.id;
      productLineData.variants.push(variantLineData);
    });
  }

  return productLineData;
}

function getProductData(product) {
  var productId = product.ID;
  var productName = !empty(product.name) ? product.name : '';
  var productDesc = !empty(product.shortDescription) ? product.shortDescription.toString() : '';
  var productSku = !empty(product.manufacturerSKU) ? product.manufacturerSKU : '';
  var siteId = Site.current.ID;
  var modifiedTime = !empty(product.lastModified) ? new Calendar(product.lastModified) : null;
  var lastModified = modifiedTime ? StringUtils.formatCalendar(modifiedTime, 'MM/dd/yyyy:hh:mm') : '';
  var isOnline = product.online.toString();
  var upc = !empty(product.UPC) ? product.UPC : '';
  var brand = !empty(product.brand) ? product.brand : '';
  var masterProductId = getMasterProductID(product);
  var productType = JobUtils.getProductType(product);
  var productPrices = JobUtils.getPrices(product);
  var standardPrice = productPrices.standardPrice;
  var salePrice = productPrices.salePrice;
  var currency = productPrices.currencyCode;
  var productInventory = JobUtils.getInventory(product);
  var productImages = getImages(product);
  var mainImage = productImages.mainImage;
  var additionalImages = productImages.additionalImages;
  var productLink = URLUtils.https('Product-Show', 'pid', product.ID).toString();
  var productData = {
    id: productId,
    name: productName,
    description: productDesc,
    ats: productInventory.ATS,
    sku: productSku,
    upc: upc,
    brand: brand,
    online: isOnline,
    product_type: productType,
    price: standardPrice,
    sale_price: salePrice,
    currency: currency,
    inventory: productInventory.allocation,
    availability: productInventory.availabilityStatus,
    image: mainImage,
    additional_images: additionalImages,
    product_page_url: productLink,
    last_modified: lastModified,
    site_id: siteId
  };
  return productData;
}
/**
 * Return master product id for variants and variation group products.
 * @param {dw.catalog.Product} product product to process
 * @returns {string} master product ID
 */


function getMasterProductID(product) {
  var productId = '';

  if ((product.isVariationGroup() || product.isVariant()) && !empty(product.getMasterProduct())) {
    productId = product.getMasterProduct().ID;
  } else if (product.isMaster()) {
    productId = product.ID;
  }

  return productId;
}
/**
 * Get product images
 * @param {dw.catalog.Product} product product to process
 * @returns {Object} images object
 */


function getImages(product) {
  var instanceHostName = System.getInstanceHostname();
  var viewTypes = ['medium', 'small', 'swatch', 'hi-res'];
  var images = {};
  var imageProduct;

  if (product.variant && !empty(product.getVariationModel())) {
    imageProduct = product.getVariationModel();
  } else {
    imageProduct = product;
  } // get main image url


  var mainImage = imageProduct.getImage('large', 0);

  if (!empty(mainImage)) {
    images.mainImage = {
      abs_url: mainImage.getAbsURL().toString(),
      alt: mainImage.alt,
      dis_base_url: mainImage.getAbsImageURL({
        scaleWidth: 100
      }).toString().split('?')[0],
      path: getImagePath(mainImage.getURL().toString()),
      title: mainImage.title
    };
  } else {
    images.mainImage = {};
  } // get other view types images


  images.additionalImages = getAdditionalImages(imageProduct, viewTypes, instanceHostName);
  return images;
}
/**
 * Get image path
 * @param {String} product image URL
 * @returns {String} product image path
 */


function getImagePath(imageURL) {
  var imageURLParts = imageURL.split('/');

  while (imageURLParts.length > 0 && imageURLParts[0] != 'images') {
    imageURLParts.shift();
  }

  return imageURLParts.join('/');
}
/**
 * Get other view types images
 * @param {dw.catalog.Product} product product to process
 * @param {Array} viewTypes image view types array
 * @param {string} instanceHostName host name
 * @returns {Array} other images object
 */


function getAdditionalImages(product, viewTypes, instanceHostName) {
  var images = [];
  viewTypes.forEach(function (viewtype) {
    var image = product.getImage(viewtype, 0);

    if (!empty(image)) {
      var imageUrl = {
        abs_url: image.getAbsURL().toString(),
        alt: image.alt,
        dis_base_url: image.getAbsImageURL({
          scaleWidth: 100
        }).toString().split('?')[0],
        path: getImagePath(image.getURL().toString()),
        title: image.title
      };
      images.push(imageUrl);
    }
  });
  return images;
}

exports.initExport = initExport;