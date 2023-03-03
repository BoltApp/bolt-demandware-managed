'use strict';

var boltUtil = require('./boltUtil');

var boltCheckoutConfigure = function (cart, hints, callback, parameters) {
    if (boltUtil.BoltState.BoltCheckBtnInitiated) {
        return;
    }
    // Check if BoltCheckout is defined (connect.js executed).
    // If not, postpone processing until it is
    if (!window.BoltCheckout) {
        boltUtil.whenDefined(window, 'BoltCheckout', callConfigure, 'callConfigure');
        return;
    }
    BoltCheckout.configure(cart, hints, callback, parameters);
    boltUtil.BoltState.BoltCheckBtnInitiated = true;
}

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
                    boltCheckoutConfigure(cart, data.hints, boltCallbacks); // eslint-disable-line no-undef
                } else {
                    boltCheckoutConfigure(cart, data.hints, null); // eslint-disable-line no-undef
                }
            }
        }
    });
};

onElementReady('[data-tid="instant-bolt-checkout-button"]', function (element) {
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
