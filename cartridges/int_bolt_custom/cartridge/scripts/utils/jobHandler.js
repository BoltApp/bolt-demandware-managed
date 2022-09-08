'use strict';

/*
 * Process Wrapper to generate feeds
 */

/* API Includes */
var ProductMgr = require('dw/catalog/ProductMgr');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');

/* Script Includes */
var LogUtils = require('int_bolt_core/cartridge/scripts/utils/boltLogUtils');
var log = LogUtils.getLogger('BoltCatalogExportJob');

/**
 * Main process to run the feed generation.
 * @param {dw.util.Map} context job context
 * @param {Function} filterCond function to decide export a product
 * @param {Function} processFunc function to generate feed item
 * @returns {dw.system.Status} job status
 */
function process(context, filterCond, processFunc) {
    try {
        var batchNumber = 1;
        var currentTime = new Date();
        var recordArray = [];
        var path = context.path;
        var chunkSize = context.chunkSize;
        var metaFileName = path + 'meta.json';
        var oldMetaFile = new File(metaFileName);

        if (oldMetaFile.exists()) {
            oldMetaFile.remove();
        }

        // create folder if doesn't exist
        var feedFolder = new File(path);

        if (!feedFolder.exists()) {
            feedFolder.mkdirs();
        }

        var timestamp = StringUtils.formatCalendar(new Calendar(currentTime), 'yyyy-MM-dd');
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

        products.close();

        // save the timestamp for this run
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
 * @param {dw.util.SeekableIterator} productsIterator iterator
 * @param {number} maxSize size
 * @param {Function} filterCond function to decide export a product
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
 * @param {Array} products contains the products to export
 * @param {Object} feedMetaInfo meta information
 * @param {Function} processFunc function to generate feed item
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
        metadata: generateMetaInFeed(productsToExport.length, baseFeedName, batchNumber),
        products: productsToExport
    };
    fileWriter.writeLine(JSON.stringify(feedData));
    fileWriter.close();
    return feedFile;
}

/**
 * Generate Meta file to record what feeds are generated with this job run
 * @param {number} productTotal number of total product in a batch
 * @param {Array} recordArray contains the products to export
 * @param {number} chunkSize chunk size
 * @param {string} path file path
 * @param {date} currentTime current tile
 * @param {string} metaFileName meta file name
 * @param {string} baseFeedName base feed name
 * @returns {null} return null
 */
function generateMetaFile(productTotal, recordArray, chunkSize, path, currentTime, metaFileName, baseFeedName) {
    var fileWriter = new FileWriter(new File(metaFileName));
    fileWriter.writeLine(JSON.stringify({
        last_job_run: StringUtils.formatCalendar(new Calendar(currentTime), "yyyy-MM-dd'T'HH:mm:ss"),
        base_feed_name: baseFeedName,
        products_per_page: chunkSize,
        total_pages: recordArray.length,
        total_products: productTotal,
        records: recordArray
    }));
    fileWriter.close();
    return null;
}

/**
 * Generate Meta Header
 * @param {number} productCount product number in the feed
 * @param {string} baseFeedName feed name
 * @param {number} currentPage page number
 * @returns {JSON} returning meta info in JSON format
 */
function generateMetaInFeed(productCount, baseFeedName, currentPage) {
    var metaJSON = {
        current_page: currentPage,
        base_feed_name: baseFeedName,
        products_per_page: productCount
    };
    return metaJSON;
}

/**
 * Save the current time to custom object
 * @param {Object} productCheckpoint SFCC custom object which store the last modify information
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
