'use strict';

var base = require('base/product/base');

var ppcButtonClass = 'bolt-product-checkout-button';
// isProductPageCheckoutButtonVisible is used to track the visibility of the PPC button
var ppcButtonVisible;
// ppcCart contains BoltCart which is obtained by calling BoltCheckout.configureProductCheckout
var ppcCart;
// setupPPCButtonPoller is the ID of the timer that is used to show the Bolt PPC button.
var setupPPCButtonPoller;

var successRedirect = $('#successRedirect').val();
var sfccData;
var callbacks = {
    check: function () {
        console.log('Inside check function');
        if (ppcCart) {
            return ppcCart;
        }

        if (ppcButtonVisible) {
            // Display an error message to the user.
            console.error('Bolt ppc cart is invalid');
        }
        return undefined;
    },
    close: function () {
        // This function is called when the Bolt checkout modal is closed.
        var sfccBaseVersion = $('#sfccBaseVersion').val();
        if (sfccData && sfccBaseVersion >= 6) {
            var redirect = $('<form>')
                .appendTo(document.body)
                .attr({
                    method: 'POST',
                    action: successRedirect
                });

            $('<input>')
                .appendTo(redirect)
                .attr({
                    name: 'orderID',
                    value: sfccData.merchant_order_number
                });

            $('<input>')
                .appendTo(redirect)
                .attr({
                    name: 'orderToken',
                    value: sfccData.sfcc.sfcc_order_token
                });

            redirect.submit();
        }
    },
    onCheckoutStart: function () {
        // This function is called after the checkout form is presented to the user.
    },

    // eslint-disable-next-line no-unused-vars
    onEmailEnter: function (email) {
        // This function is called after the user enters their email address.
    },

    onShippingDetailsComplete: function () {
        // This function is called when the user proceeds to the shipping options page.
        // This is applicable only to multi-step checkout.
    },

    onShippingOptionsComplete: function () {
        // This function is called when the user proceeds to the payment details page.
        // This is applicable only to multi-step checkout.
    },

    onPaymentSubmit: function () {
        // This function is called after the user clicks the pay button.
    },
    success: function (transaction, callback) {
        // This function is called when the Bolt checkout transaction is successful.
        sfccData = transaction;
        console.log(`----------- ${JSON.stringify(transaction)} -----------`);
        callback();
    }
};

var showPPCButton = function () {
    setupPPCButtonPoller = setInterval(function () {
        var ppcBoltButton = $('.bolt-button-wrapper[data-tid="instant-bolt-checkout-button"]'); // @ts-ignore
        var ppcButtonLoaded = ppcBoltButton && window.BoltCheckout && ppcBoltButton.children()[0].nodeName === 'svg';
        if (ppcButtonLoaded) {
            ppcBoltButton[0].style.display = '';
            ppcButtonVisible = true;
            clearInterval(setupPPCButtonPoller);
        }
    }, 250);
};

var hidePPCButton = function () {
    if (setupPPCButtonPoller) {
        clearInterval(setupPPCButtonPoller);
    }
    var ppcBoltButton = $('.bolt-button-wrapper[data-tid="instant-bolt-checkout-button"]'); // @ts-ignore
    if (ppcBoltButton) {
        ppcBoltButton[0].style.display = 'None';
    }
    ppcButtonVisible = false;
};

// configurePPCCart should be called as soon as the product is ready to be ordered and
// whenever the product's attributes change.
var configurePPCCartAndShowButton = function (boltCartObject) {
    if (!window.BoltCheckout) {
        console.error('Unable to call BoltConnect.ConfigureProductCheckout since window.BoltCheckout is defined');
        return;
    }
    ppcCart = boltCartObject;
    var result = window.BoltCheckout.configureProductCheckout(
        boltCartObject,
        {}, // Hints
        callbacks,
        { checkoutButtonClassName: ppcButtonClass }
    );
    if (result instanceof Error) {
        console.error(`Call to BoltCheckout.configureProductCheckout returned an error ${result.toString()}`);
        return;
    }
    console.log('Call to BoltCheckout.configureProductCheckout was successful');
    showPPCButton();
};

// configurePPCCart should be called as soon as the product is ready to be ordered and
// whenever the product's attributes change.
var clearPPCCartAndHideButton = function () {
    ppcCart = undefined;
    hidePPCButton();
};

const buildBoltCartObject = function (product) {
    if (!product.available || !product.readyToOrder) {
        return undefined;
    }

    const productID = product.id;
    const productImage = product.images.small[0].absURL;
    const productName = product.productName;
    const quantity = product.selectedQuantity;
    var productOptions = [];
    // To get options such as "Extended Warranty" and send to Bolt server for creating cart.
    if (!$('.bundle-item').length) {
        var addToCartBtn = $('button.add-to-cart');
        var $productContainer = addToCartBtn.closest('.product-detail');
        if (!$productContainer.length) {
            $productContainer = addToCartBtn.closest('.quick-view-dialog').find('.product-detail');
        }
        productOptions = getOptions($productContainer);
    }

    return {
        currency: 'USD',
        items: [
            {
                reference: productID,
                merchantProductID: productID,
                quantity: quantity,
                name: productName,
                image: productImage,
                options: productOptions
            }
        ]
    };
};

/**
 * Retrieves the relevant pid value
 * @param {jquery} $el - DOM container for a given add to cart button
 * @return {string} - value to be used when adding product to cart
 */
var getPidValue = function ($el) {
    var pid;

    if ($('#quickViewModal').hasClass('show') && !$('.product-set').length) {
        pid = $($el).closest('.modal-content').find('.product-quickview').data('pid');
    } else if ($('.product-set-detail').length || $('.product-set').length) {
        pid = $($el).closest('.product-detail').find('.product-id').text();
    } else {
        pid = $('.product-detail:not(".bundle-item")').data('pid');
    }

    return pid;
};

/**
 * Retrieve product options
 *
 * @param {jQuery} $productContainer - DOM element for current product
 * @return {string} - Product options and their selected values
 */
var getOptions = function ($productContainer) {
    var options = $productContainer
        .find('.product-option')
        .map(function () {
            var $elOption = $(this).find('.options-select');
            var urlValue = $elOption.val();
            var selectedValueId = $elOption.find('option[value="' + urlValue + '"]')
                .data('value-id');
            return {
                optionId: $(this).data('option-id'),
                selectedValueId: selectedValueId
            };
        }).toArray();

    return options;
}

$(document).ready(function () {
    var addToCartBtn = $('button.add-to-cart');
    // When product details page has fully loaded and if the add-to-cart button is enabled,
    // we can get product data from controller Product-Variation (which is defined in sfcc core)
    // to build Bolt cart object to initiate Bolt PPC button
    if (!addToCartBtn.prop('disabled')) {
        var pid = getPidValue(addToCartBtn);
        var productContainer = addToCartBtn.closest('.product-detail');
        var ppcQuantity = productContainer.find('.quantity-select').val();
        var getProductDataUrl = $('.get-ppc-product-data').val() + '?pid=' + pid + '&quantity=' + ppcQuantity;
        $.ajax({
            url: getProductDataUrl,
            method: 'GET',
            async: false,
            success: function (data) {
                if (data !== null && data.hasOwnProperty('product')) {
                    var product = data.product;
                    if (product.available && product.readyToOrder) {
                        var boltCartObject = buildBoltCartObject(product);
                        configurePPCCartAndShowButton(boltCartObject);
                    }
                }
            }
        });
    }
    // product:statusUpdate
    $(document).bind('product:updateAddToCart', function (_e, productResponse) {
        console.log('On Status Update', productResponse);
        var product = productResponse.product;
        if (product.available && product.readyToOrder) {
            var boltCartObject = buildBoltCartObject(product);
            console.log(boltCartObject);
            configurePPCCartAndShowButton(boltCartObject);
        } else {
            clearPPCCartAndHideButton();
        }
    });
});


// ----------------------------- WIP -----------------------------
/*
    Problems with the current implementation of `buildBoltCartObject`
    1) It is invoked in response to a `product:updateAddToCart` event. So unless the user updates the product
       attributes it won't be invoked -> which means PPC button won't be shown unless user changes product attributes
    2) Similar to point 1. We need to find a way to invoke it on page load. Certain products are in the ready to order state
       as soon as the page loads. The existing implementation won't show PPC unless user changes product attributes
    3) Current implementation won't work on pages that have product bundles or product sets
    4) Current implementation won't include priced attributes. Eg: Warranty on page
       Eg: See this page: https://zzgv-010.dx.commercecloud.salesforce.com/s/RefArch/electronics/digital%20cameras/kodak-z8612M.html?lang=en_US
       Warranty price won't be included in the product page checkout cart.

    wipBuildBoltCartObject is being built to address all these issues.
    It's heavily inspired (i.e copied :-P from 'storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/js/product/base.js')
*/
// TODO: buildBoltCartObject should either return a valid BoltCart object (or) undefined
//       It will be invoked once on page load (and) whenever the product attributes change.
// eslint-disable-next-line no-unused-vars
var wipBuildBoltCartObject = function () {
    var getChildProducts = function () {
        var childProducts = [];
        $('.bundle-item').each(function () {
            childProducts.push({
                pid: $(this).find('.product-id').text(),
                quantity: parseInt($(this).find('label.quantity').data('quantity'), 10)
            });
        });
        return childProducts.length ? JSON.stringify(childProducts) : [];
    };

    var getOptions = function ($productContainer) {
        var options = $productContainer
            .find('.product-option')
            .map(function () {
                var $elOption = $(this).find('.options-select');
                var urlValue = $elOption.val();
                var selectedValueId = $elOption.find('option[value="' + urlValue + '"]')
                    .data('value-id');
                return {
                    optionId: $(this).data('option-id'),
                    selectedValueId: selectedValueId
                };
            }).toArray();
        return JSON.stringify(options);
    };

    var pid;
    var pidsObj;
    var setPids;

    var buttons = $('button.add-to-cart,  button.add-to-cart-global');
    if (!buttons.length) {
        console.error('Unable to find add to cart buttons');
        return undefined;
    }
    var button = buttons[0];

    if ($('.set-items').length && $(button).hasClass('add-to-cart-global')) {
        setPids = [];
        $('.product-detail').each(function () {
            if (!$(this).hasClass('product-set-detail')) {
                setPids.push({
                    pid: $(this).find('.product-id').text(),
                    qty: $(this).find('.quantity-select').val(),
                    options: getOptions($(this))
                });
            }
        });
        pidsObj = JSON.stringify(setPids);
    }

    pid = base.getPidValue(button);

    var $productContainer = $(button).closest('.product-detail');
    if (!$productContainer.length) {
        $productContainer = $(button).closest('.quick-view-dialog').find('.product-detail');
    }

    var form = {
        pid: pid,
        pidsObj: pidsObj,
        childProducts: getChildProducts(),
        quantity: base.getQuantitySelected($(button))
    };

    console.log(`The form element is ${JSON.stringify(form)}`);

    if (!$('.bundle-item').length) {
        form.options = getOptions($productContainer);
    }

    return {
        currency: 'USD',
        items: [
            {
                reference: form.pid,
                quantity: parseInt(form.quantity, 10),
                merchantProductID: form.pid,
                name: 'Casual Spring Easy Jacket'
            }
        ]
    };
};
