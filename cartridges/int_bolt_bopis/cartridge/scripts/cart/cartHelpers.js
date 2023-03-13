'use strict';

var base = module.superModule;

var StoreMgr = require('dw/catalog/StoreMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var ShippingMgr = require('dw/order/ShippingMgr');
var UUIDUtils = require('dw/util/UUIDUtils');
var Resource = require('dw/web/Resource');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var arrayHelper = require('*/cartridge/scripts/util/array');
var collections = require('*/cartridge/scripts/util/collections');
var instorePickupStoreHelper = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

/**
 * Determines whether a product's current instore pickup store setting are
 * the same as the previous selected
 *
 * @param {string} existingStoreId - store id currently associated with this product
 * @param {string} selectedStoreId - store id just selected
 * @return {boolean} - Whether a product's current store setting is the same as
 * the previous selected
 */
function hasSameStore(existingStoreId, selectedStoreId) {
    return existingStoreId === selectedStoreId;
}

/**
 * Loops through all Shipments and attempts to select a ShippingMethod, where absent
 * @param {dw.catalog.Product} product - Product object
 * @param {string} productId - Product ID to match
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - Collection of the Cart's
 *     product line items
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @param {string} storeId - store id
 * @return {dw.order.ProductLineItem} - Filtered the product line item matching productId
 *  and has the same bundled items or options and the same instore pickup store selection
 */
function getExistingProductLineItemInCartWithTheSameStore(
    product,
    productId,
    productLineItems,
    childProducts,
    options,
    storeId) {
    var existingProductLineItem = null;
    var matchingProducts = base.getExistingProductLineItemsInCart(
        product,
        productId,
        productLineItems,
        childProducts,
        options);
    if (matchingProducts.length) {
        existingProductLineItem = arrayHelper.find(matchingProducts, function (matchingProduct) {
            return hasSameStore(matchingProduct.custom.fromStoreId, storeId);
        });
    }
    return existingProductLineItem;
}

/**
 * Get the existing in store pickup shipment in cart by storeId
 * @param {dw.order.Basket} basket - the target Basket object
 * @param {string} storeId - store id
 * @return {dw.order.Shipment} returns Shipment object if the existing shipment has the same storeId
 */
function getInStorePickupShipmentInCartByStoreId(basket, storeId) {
    var existingShipment = null;
    if (basket && storeId) {
        var shipments = basket.getShipments();
        if (shipments.length) {
            existingShipment = arrayHelper.find(shipments, function (shipment) {
                return hasSameStore(shipment.custom.fromStoreId, storeId);
            });
        }
    }
    return existingShipment;
}

/**
 * create a new instore pick shipment if the store shipment
 * is not exist in the basket for adding product line item
 * @param {dw.order.Basket} basket - the target Basket object
 * @param {string} storeId - store id
 * @param {Object} req - The local instance of the request object
 * @return {dw.order.Shipment} returns Shipment object
 */
function createInStorePickupShipmentForLineItem(basket, storeId, req) {
    var shipment = null;
    if (basket && storeId) {
        // check if the instore pickup shipment is already exist.
        shipment = getInStorePickupShipmentInCartByStoreId(basket, storeId);
        if (!shipment) {
            // create a new shipment to put this product line item in
            shipment = basket.createShipment(UUIDUtils.createUUID());
            shipment.custom.fromStoreId = storeId;
            shipment.custom.shipmentType = 'instore';
            req.session.privacyCache.set(shipment.UUID, 'valid');

            // Find in-store method in shipping methods.
            var shippingMethods =
                ShippingMgr.getShipmentShippingModel(shipment).getApplicableShippingMethods();
            var shippingMethod = collections.find(shippingMethods, function (method) {
                return method.custom.storePickupEnabled;
            });
            var store = StoreMgr.getStore(storeId);
            var storeAddress = {
                address: {
                    firstName: store.name,
                    lastName: '',
                    address1: store.address1,
                    address2: store.address2,
                    city: store.city,
                    stateCode: store.stateCode,
                    postalCode: store.postalCode,
                    countryCode: store.countryCode.value,
                    phone: store.phone
                },
                shippingMethod: shippingMethod.ID
            };
            COHelpers.copyShippingAddressToShipment(storeAddress, shipment);
        }
    }
    return shipment;
}

/**
 * Adds a product to the cart. If the product is already in the cart it increases the quantity of
 * that product.
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {string} productId - the productId of the product being added to the cart
 * @param {number} quantity - the number of products to the cart
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @param {string} storeId - store id
 * @param {Object} req - The local instance of the request object
 * @return {Object} returns an error object
 */
function addProductToCart(currentBasket, productId, quantity, childProducts, options, storeId, req) {
    var availableToSell;
    var defaultShipment = currentBasket.defaultShipment;
    var perpetual;
    var product = ProductMgr.getProduct(productId);
    var productInCart;
    var productLineItems = currentBasket.productLineItems;
    var productQuantityInCart;
    var quantityToSet;
    var optionModel = productHelper.getCurrentOptionModel(product.optionModel, options);
    var result = {
        error: false,
        message: Resource.msg('text.alert.addedtobasket', 'product', null)
    };
    var Transaction = require('dw/system/Transaction');

    var lineItemQuantity = isNaN(quantity) ? base.DEFAULT_LINE_ITEM_QUANTITY : quantity;
    var totalQtyRequested = 0;
    var canBeAdded = false;

    if (product.bundle) {
        canBeAdded = base.checkBundledProductCanBeAdded(childProducts, productLineItems, lineItemQuantity);
    } else {
        totalQtyRequested = lineItemQuantity + base.getQtyAlreadyInCart(productId, productLineItems);
        perpetual = product.availabilityModel.inventoryRecord.perpetual;
        canBeAdded =
            (perpetual
            || totalQtyRequested <= product.availabilityModel.inventoryRecord.ATS.value);
    }

    if (!canBeAdded) {
        result.error = true;
        result.message = Resource.msgf(
            'error.alert.selected.quantity.cannot.be.added.for',
            'product',
            null,
            product.availabilityModel.inventoryRecord.ATS.value,
            product.name
        );
        return result;
    }
    // Get the existing product line item from the basket if the new product item
    // has the same bundled items or options and the same instore pickup store selection
    productInCart = getExistingProductLineItemInCartWithTheSameStore(
        product, productId, productLineItems, childProducts, options, storeId);
    if (productInCart) {
        productQuantityInCart = productInCart.quantity.value;
        quantityToSet = lineItemQuantity ? lineItemQuantity + productQuantityInCart : productQuantityInCart + 1;
        availableToSell = productInCart.product.availabilityModel.inventoryRecord.ATS.value;

        if (availableToSell >= quantityToSet || perpetual) {
            productInCart.setQuantityValue(quantityToSet);
            result.uuid = productInCart.UUID;
        } else {
            result.error = true;
            result.message = availableToSell === productQuantityInCart
                ? Resource.msg('error.alert.max.quantity.in.cart', 'product', null)
                : Resource.msg('error.alert.selected.quantity.cannot.be.added', 'product', null);
        }
    } else {
        var productLineItem;
        // Create a new instore pickup shipment as default shipment for product line item
        // if the shipment if not exist in the basket
        var inStoreShipment = createInStorePickupShipmentForLineItem(currentBasket, storeId, req);
        var shipment = inStoreShipment || defaultShipment;

        if (shipment.shippingMethod && shipment.shippingMethod.custom.storePickupEnabled && !storeId) {
            shipment = currentBasket.createShipment(UUIDUtils.createUUID());
        }

        productLineItem = base.addLineItem(
            currentBasket,
            product,
            lineItemQuantity,
            childProducts,
            optionModel,
            shipment
        );

        // Once the new product line item is added, set the instore pickup fromStoreId for the item
        if (productLineItem.product.custom.availableForInStorePickup) {
            if (storeId) {
                instorePickupStoreHelper.setStoreInProductLineItem(storeId, productLineItem);
            }
        }
        result.uuid = productLineItem.UUID;
    }

    Transaction.wrap(function () {
        COHelpers.ensureNoEmptyShipments(req);
    });

    return result;
}

module.exports = {
    addProductToCart: addProductToCart
};
Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
