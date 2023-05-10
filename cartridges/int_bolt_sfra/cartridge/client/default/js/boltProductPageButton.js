'use strict';

// initProductPageCheckoutButton Polls:
// 1) the DOM for the product page checkout button container
// 2) BoltConnect
// when they become available, it attaches an onclick event handler to it.
var initProductPageCheckoutButton = function () {
    var boltButtonExist = setInterval(function () {
        var checkoutBoltButton = $('.bolt-product-checkout-button')[0]; // @ts-ignore
        // have to check if child of this dom is svg, otherwise bolt button is not fully rendered (it's the object)
        var boltButtonLoaded = checkoutBoltButton && window.BoltCheckout;
        if (boltButtonLoaded) {
            clearInterval(boltButtonExist);
            console.log('Bolt connect has loaded and product page button is ready!');
        }
    }, 250);
};

$(document).ready(function () {
    console.log('Trying to initialize Bolt PPC');
    initProductPageCheckoutButton();
});
