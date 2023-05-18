'use strict';

// showBoltProductPageCheckoutButton Polls:
// 1) the DOM for the product page checkout button container
// 2) BoltConnect
// when they become available, it attaches an onclick event handler to it.
var showBoltProductPageCheckoutButton = function () {
    var boltButtonExist = setInterval(function () {
        var checkoutBoltButton = $('.bolt-button-wrapper[data-tid="instant-bolt-checkout-button"]'); // @ts-ignore
        // have to check if child of this dom is svg, otherwise bolt button is not fully rendered (it's the object)
        var boltButtonLoaded = checkoutBoltButton && window.BoltCheckout && checkoutBoltButton.children()[0].nodeName === 'svg';
        if (boltButtonLoaded) {
            clearInterval(boltButtonExist);
            console.log('Bolt connect has loaded and product page button is ready!');
        }
    }, 250);
};

var callBoltConfigure = function (product) {
    if (product.available && product.readyToOrder) {
        console.log('Ready to call BoltCheckout.Configure');
        console.log(product);
    } else {
        console.log('Ready to UnConfigure');
    }
};

$(document).ready(function () {
    console.log('Trying to initialize Bolt PPC');

    // eslint-disable-next-line no-unused-vars
    $(document).bind('product:updateAddToCart', function (_e, addToCartResponse) {
        callBoltConfigure(addToCartResponse.product);
    });

    $(document).bind('product:statusUpdate', function (_e, product) {
        // This contains the addToCartURL.
        console.log('On Status Update', product);
    });

    showBoltProductPageCheckoutButton();
});
