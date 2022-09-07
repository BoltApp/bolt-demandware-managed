'use strict';

/**
 * Resource helper
 *
 */
function ResourceHelper() {}

/**
 * Get the client-side resources of a given page
 * @returns {Object} An objects key key-value pairs holding the resources
 */
ResourceHelper.getResources = function () {
    var Resource = require('dw/web/Resource'); // application resources

    var resources = {
    // Transaction operation messages
        SHOW_ACTIONS: Resource.msg('operations.show.actions', 'bolt', null),
        HIDE_ACTIONS: Resource.msg('operations.hide.actions', 'bolt', null),
        CHOOSE_ACTIONS: Resource.msg('operations.actions', 'bolt', null),
        TRANSACTION_SUCCESS: Resource.msg('transaction.success', 'bolt', null),
        TRANSACTION_FAILED: Resource.msg('transaction.failed', 'bolt', null),
        TRANSACTION_PROCESSING: Resource.msg('operations.wait', 'bolt', null),
        INVALID_CAPTURE_AMOUNT: Resource.msg('capture.amount.validation', 'bolt', null),
        INVALID_REFUND_AMOUNT: Resource.msg('refund.amount.validation', 'bolt', null),
        MAXIMUM_REFUND_AMOUNT: Resource.msg('maximum.refund.amount', 'bolt', null),
        MAXIMUM_CAPTURE_AMOUNT: Resource.msg('maximum.capture.amount', 'bolt', null)
    };
    return resources;
};

/**
 * Get the client-side URLs of a given page
 * @returns {Object} An objects key key-value pairs holding the URLs
 */
ResourceHelper.getUrls = function () {
    var URLUtils = require('dw/web/URLUtils'); // application urls

    var urls = {
        operationActions: URLUtils.url('Operations-Action').toString()
    };
    return urls;
};

module.exports = ResourceHelper;
