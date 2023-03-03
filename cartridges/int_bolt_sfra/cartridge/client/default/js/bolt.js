'use strict';

var successRedirect = $('#successRedirect').val();
var sfccData;
var callbacks = {
    close: function () {
    // This function is called when the Bolt checkout modal is closed.
        if (sfccData) {
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
        callback();
    }
};

var configureBoltApp = function () {
    var createBoltOrderUrl = $('.create-bolt-order-url').val();
    var sfccBaseVersion = $('#sfccBaseVersion').val();
    $.ajax({
        url: createBoltOrderUrl,
        method: 'GET',
        async: false,
        success: function success(data) {
            if (data !== null) {
                // use the response from backend to configure Bolt connect
                var cart = {
                    id: data.basketID
                };
                if (sfccBaseVersion >= 6) {
                    window.BoltButtonApp = BoltCheckout.configure(cart, data.hints, callbacks); // eslint-disable-line no-undef
                } else {
                    window.BoltButtonApp = BoltCheckout.configure(cart, data.hints, null); // eslint-disable-line no-undef
                }
            }
        }
    });
};

var BoltHasConfigureRun = function () {
    return typeof window.BoltButtonApp !== 'undefined';
};

exports.initBoltButton = function () {
    var boltButtonExist = setInterval(function () {
        var checkoutBoltButton = $('[data-tid="instant-bolt-checkout-button"]'); // @ts-ignore
        // have to check if child of this dom is svg, otherwise bolt button is not fully rendered (it's the object)
        var boltButtonLoaded = checkoutBoltButton && window.BoltCheckout && checkoutBoltButton.children()[0].nodeName === 'svg';
        if (boltButtonLoaded) {
            clearInterval(boltButtonExist);

            $('[data-tid="instant-bolt-checkout-button"]').children().replaceWith($('[data-tid="instant-bolt-checkout-button"]').children().clone());
            if (!BoltHasConfigureRun()) {
                configureBoltApp();
            }
            // add an event handler to Bolt button's click
            checkoutBoltButton.click(function (e) {
                if ($(e.target).attr('data-tid') !== 'apple-pay-button') {
                    window.BoltButtonApp.open();
                }
            });
        }
    }, 100);
};

exports.BoltHasConfigureRun = BoltHasConfigureRun;
