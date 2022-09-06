'use strict';

/* eslint-disable*/

/*
 * Process Wrapper to generate feeds
 */

/* API Includes */
var ProductMgr = require('dw/catalog/ProductMgr');

var File = require('dw/io/File');

var FileWriter = require('dw/io/FileWriter');

var CSVStreamWriter = require('dw/io/CSVStreamWriter');

var StringUtils = require('dw/util/StringUtils');

var Calendar = require('dw/util/Calendar');

var Status = require('dw/system/Status');

var Transaction = require('dw/system/Transaction');
/* Script Includes */


var LogUtils = require('int_bolt_v2/cartridge/scripts/utils/boltLogUtils');

var log = LogUtils.getLogger('BoltCatalogExportJob');
/**
 * Main process to run the feed generation.
 * @param {dw.util.Map} context job context
 * @param {Function} filter function to decide export a product
 * @param {Function} process function to generate feed item
 * @returns {dw.system.Status} job status
 */

function process(context, filterCond, processFunc) {
  try {
    var index = 0;
    var batchNumber = 1;
    var newBatch = true;
    var currentTime = new Date();
    var recordArray = [];
    var path = context.path;
    var chunkSize = context.chunkSize;
    var metaFileName = path + 'meta.json';
    var oldMetaFile = new File(metaFileName);

    if (oldMetaFile.exists()) {
      oldMetaFile.remove();
    } // create folder if doesn't exist


    var feedFolder = new File(path);

    if (!feedFolder.exists()) {
      feedFolder.mkdirs();
    }

    var timestamp = StringUtils.formatCalendar(new Calendar(currentTime), "yyyy-MM-dd");
    var currentMilliseconds = currentTime.getTime().toFixed();
    var baseFeedName = StringUtils.format('{0}-{1}-{2}', context.feedName, timestamp, currentMilliseconds); // query products

    var products = ProductMgr.queryAllSiteProducts();
    var productCount = 0;

    while (products.hasNext()) {
      var productsToExport = generateProductArray(products, chunkSize, filterCond, context);
      var feedMetaInfo = {
        path: path,
        baseFeedName: baseFeedName,
        batchNumber: batchNumber
      };
      var feedFile = generateProductFeed(productsToExport, feedMetaInfo, processFunc);

      if (feedFile !== null) {
        recordArray.push(feedFile.name);
      }

      productCount += productsToExport.length;
      batchNumber += 1;
    }

    products.close(); // save the timestamp for this run

    saveCheckPoint(context.productCheckpoint);
    log.info('File Generation Completed.');
    generateMetaFile(productCount, recordArray, chunkSize, path, currentTime, metaFileName, baseFeedName);
    return new Status(Status.OK);
  } catch (e) {
    log.error(StringUtils.format('Error occurs when generating feed {0} : {1}', context.feedName, e.message));
    return new Status(Status.ERROR);
  }
}
/**
 * add a certain number of products to array for batch export
 * @param {dw.util.SeekableIterator} product iterator
 * @param {Number} chunk size
 * @param {Function} filter function to decide export a product
 * @param {dw.util.Map} context job context
 * @returns {Array} array contains products to be exported
 */


function generateProductArray(productsIterator, maxSize, filterCond, context) {
  var productsToExport = [];

  while (productsIterator.hasNext() && productsToExport.length < maxSize) {
    var product = productsIterator.next();

    if (filterCond(product, context)) {
      productsToExport.push(product);
    }
  }

  return productsToExport;
}
/**
 * Generate product feed in JSON format
 * @param {Array} array contains the products to export
 * @param {Object} feed meta information
 * @param {Function} process function to generate feed item
 * @returns {dw.io.File} SFCC File object
 */


function generateProductFeed(products, feedMetaInfo, processFunc) {
  var baseFeedName = feedMetaInfo.baseFeedName;
  var batchNumber = feedMetaInfo.batchNumber;
  var feedName = StringUtils.format('{0}{1}-{2}.json', feedMetaInfo.path, baseFeedName, batchNumber);
  var feedFile = new File(feedName);
  var fileWriter = new FileWriter(feedFile);
  var productsToExport = [];
  products.forEach(function (product) {
    try {
      productsToExport.push(processFunc(product));
    } catch (e) {
      log.error(StringUtils.format('Failed to export product {0} due to error: {1}', product, e.message));
    }
  });
  var feedData = {
    "metadata": generateMetaInFeed(productsToExport.length, baseFeedName, batchNumber),
    "products": productsToExport
  };
  fileWriter.writeLine(JSON.stringify(feedData));
  fileWriter.close();
  return feedFile;
}
/**
 * Generate Meta file to record what feeds are generated with this job run
 * @returns {null} returning null since nothing needs to be returned
 */


function generateMetaFile(productTotal, recordArray, chunkSize, path, currentTime, metaFileName, baseFeedName) {
  var fileWriter = new FileWriter(new File(metaFileName));
  fileWriter.writeLine(JSON.stringify({
    "last_job_run": StringUtils.formatCalendar(new Calendar(currentTime), "yyyy-MM-dd'T'HH:mm:ss"),
    "base_feed_name": baseFeedName,
    "products_per_page": chunkSize,
    "total_pages": recordArray.length,
    "total_products": productTotal,
    "records": recordArray
  }));
  fileWriter.close();
  return null;
}
/**
 * Generate Meta Header
 * @param {Number} total product number in the feed
 * @param {String} base feed name
 * @param {Number} current page number
 * @returns {JSON} returning meta info in JSON format
 */


function generateMetaInFeed(productCount, baseFeedName, currentPage) {
  var metaJSON = {
    "current_page": currentPage,
    "base_feed_name": baseFeedName,
    "products_per_page": productCount
  };
  return metaJSON;
}
/**
 * Save the current time to custom object
 * @returns {null} returning null since this is just a process to save time value in custom object
 */


function saveCheckPoint(productCheckpoint) {
  if (!empty(productCheckpoint)) {
    Transaction.wrap(function () {
      productCheckpoint.custom.lastJobRun = new Date();
    });
  }

  return null;
}

exports.process = process;