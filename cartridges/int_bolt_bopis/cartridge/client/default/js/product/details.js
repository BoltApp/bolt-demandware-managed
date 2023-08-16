'use strict';

var base = require('base/product/detail');
var baseHelpers = require('base/product/base');

/**
 * Update availability on change event on quantity selector and on store:afterRemoveStoreSelection event.
 * If store has been selected, exit function otherwise proceed to update attributes.
 * @param {Object} element DOM Element.
 */
function updateStoreAvailability(element) {
    var searchPID = $(element).closest('.product-detail').attr('data-pid');
    var selectorPrefix = '.product-detail[data-pid="' + searchPID + '"]';
    var selectedStore = $(selectorPrefix + ' .selected-store-with-inventory');
    if (selectedStore.is(':visible')
        && (typeof selectedStore.attr('data-status') === 'undefined' || selectedStore.attr('data-status') === false)) {
        return;
    }

    var $productContainer = $(element).closest('.product-detail');
    if (!$productContainer.length) {
        $productContainer = $(element).closest('.modal-content').find('.product-quickview');
    }

    if ($('.bundle-items', $productContainer).length === 0) {
        baseHelpers.attributeSelect($(element).find('option:selected').data('url'), $productContainer);
    }
}

/**
 * Registering on change event on quantity selector and on store:afterRemoveStoreSelection event.
 */
base.availability = function () {
    $(document).on('change', '.quantity-select', function (e) {
        e.preventDefault();
        updateStoreAvailability($(this));
    });
    $(document).on('store:afterRemoveStoreSelection', function (e, element) {
        e.preventDefault();
        updateStoreAvailability(element);
    });
};

module.exports = base;
