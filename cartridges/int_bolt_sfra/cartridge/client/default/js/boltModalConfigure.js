'use strict';

var boltUtil = require('./boltUtil');

var boltCheckoutSetup = function () {
    var createBoltOrderUrl = $('.create-bolt-order-url').val();
    var sfccBaseVersion = $('#sfccBaseVersion').val();
    $.ajax({
        url: createBoltOrderUrl,
        method: 'GET',
        success: function success(data) {
            if (data !== null) {
                // use the response from backend to configure Bolt connect
                var cart = {
                    id: data.basketID
                };
                if (sfccBaseVersion >= 6) {
                    boltUtil.methods.boltCheckoutConfigure(cart, data.hints, boltCallbacks);
                } else {
                    boltUtil.methods.boltCheckoutConfigure(cart, data.hints, null);
                }
            }
        }
    });
};
onElementReady('[data-tid="instant-bolt-checkout-button"]', function () { // eslint-disable-line no-undef
    boltCheckoutSetup();
});
var boltSuccessRedirect = $('#successRedirect').val();
var boltSfccData;
var boltCallbacks = {
    close: function () {
        // This function is called when the Bolt checkout modal is closed.
        if (boltSfccData) {
            var redirect = $('<form>')
                .appendTo(document.body)
                .attr({
                    method: 'POST',
                    action: boltSuccessRedirect
                });
            $('<input>')
                .appendTo(redirect)
                .attr({
                    name: 'orderID',
                    value: boltSfccData.merchant_order_number
                });
            $('<input>')
                .appendTo(redirect)
                .attr({
                    name: 'orderToken',
                    value: boltSfccData.sfcc.sfcc_order_token
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
        boltSfccData = transaction;
        callback();
    }
};

var boltCartTotal = '';
/**
 * Using Mutation Observers to watch for changes being made to the cart grand total.
 * If the cart grand total changes, just reload page.
 * This is for Apple Pay only.
 */
onElementReady('[data-tid="apple-pay-button"]', function () { // eslint-disable-line no-undef
    boltCartTotal = document.querySelector('.grand-total').textContent;
});
var boltCheckoutReloadPage = function (element) {
    var newCartTotal = element.textContent;
    if (boltCartTotal && newCartTotal && newCartTotal !== boltCartTotal) {
        window.location.reload();
    }
};
boltUtil.methods.monitorDataChange(['.grand-total'], boltCheckoutReloadPage, true, true);
