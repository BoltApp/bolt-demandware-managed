'use strict';

$(document).ready(function () {
    // repeat until Bolt button is created
    var boltButtonExist = setInterval(function () {
        var checkoutBoltButton = $('[data-tid="instant-bolt-checkout-button"]'); // @ts-ignore

        if (checkoutBoltButton && window.BoltCheckout && checkoutBoltButton.children()[0].nodeName === 'svg') {
            // have to check if child of this dom is svg, otherwise bolt button is not fully rendered (it's the object)
            clearInterval(boltButtonExist);
            // This is a temp hack to make sure default event handler that opens modal doesn't work since we open it here
            // (line 33) We need to open it here instead of relying on default button event handler since user can close
            // the modal, update cart and reopen it. The second time user opens the cart will use the previous
            // Bolt order token since configure (line 32) is not guaranteed to run before modal opens

            $('[data-tid="instant-bolt-checkout-button"]').children().replaceWith($('[data-tid="instant-bolt-checkout-button"]').children().clone());
            var createBoltOrderUrl = $('.create-bolt-order-url').val();
            var isBaseV6orAbove = $('#isBaseV6orAbove').val();

            // add an event handler to Bolt button's click
            checkoutBoltButton.click(function (e) {
                // call backend to create cart in Bolt
                $.ajax({
                    url: createBoltOrderUrl,
                    method: 'GET',
                    success: function success(data) {
                        if (data !== null) {
                            // use the response from backend to configure Bolt connect
                            var cart = {
                                id: data.basketID
                            };

                            var boltButtonApp;
                            if (isBaseV6orAbove) {
                                boltButtonApp = BoltCheckout.configure(cart, data.hints, callbacks); // eslint-disable-line no-undef
                            } else {
                                boltButtonApp = BoltCheckout.configure(cart, data.hints, null); // eslint-disable-line no-undef
                            }

                            // don't open bolt modal for apple pay
                            if ($(e.target).attr('data-tid') !== 'apple-pay-button') {
                                boltButtonApp.open();
                            }
                        }
                    }
                });
            });
        }
    }, 100);
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
});
