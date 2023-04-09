'use strict';

/**
 * Get availability for in store pickup
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {dw.catalog.ProductVariationModel} variationModel - The product's variation model
 * @returns {boolean} - if selected variant product is available return selected variant
 *    availability otherwise return main product availability
 */
function getAvailableForInStorePickup(apiProduct, variationModel) {
    var isSelectedVariantAvailableForInStorePickup = variationModel
        && variationModel.selectedVariant
        && variationModel.selectedVariant.custom
        && variationModel.selectedVariant.custom.availableForInStorePickup
        ? variationModel.selectedVariant.custom.availableForInStorePickup
        : false;
    var isMainProductAvailableForInStorePickup = apiProduct.custom
        && apiProduct.custom.availableForInStorePickup
        ? apiProduct.custom.availableForInStorePickup
        : false;

    return variationModel && variationModel.selectedVariant
        ? isSelectedVariantAvailableForInStorePickup
        : isMainProductAvailableForInStorePickup;
}

module.exports = function (object, apiProduct, variationModel) {
    Object.defineProperty(object, 'availableForInStorePickup', {
        enumerable: true,
        value: getAvailableForInStorePickup(apiProduct, variationModel)
    });
};
