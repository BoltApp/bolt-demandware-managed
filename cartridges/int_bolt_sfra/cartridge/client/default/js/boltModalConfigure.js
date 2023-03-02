'use strict';

var boltUtil = require('./boltUtil');

/////////////////////////////////////////////////////////////////////////
// Using Mutation Observers to Watch for Element Availability and change.
/////////////////////////////////////////////////////////////////////////
! function (win) {

    var listeners = [],
        doc = win.document,
        MutationObserver = win.MutationObserver || win.WebKitMutationObserver,
        observer;

    function ready(selector, fn) {
        // Store the selector and callback to be monitored
        listeners.push({
            selector: selector,
            fn: fn
        });
        if (!observer) {
            // Watch for changes in the document
            observer = new MutationObserver(check);
            observer.observe(doc.documentElement, {
                childList: true,
                subtree: true
            });
        }
        // Check if the element is currently in the DOM
        check();
    }

    function check() {
        // Check the DOM for elements matching a stored selector
        for (var i = 0, len = listeners.length, listener, elements; i < len; i++) {
            listener = listeners[i];
            // Query for elements matching the specified selector
            elements = doc.querySelectorAll(listener.selector);
            for (var j = 0, jLen = elements.length, element; j < jLen; j++) {
                element = elements[j];
                // Make sure the callback isn't invoked with the
                // same element more than once
                if (!element.ready) {
                    element.ready = true;
                    // Invoke the callback with the element
                    listener.fn.call(element, element);
                }
            }
        }
    }

    // Expose methods
    win.onElementReady = ready;

}(window);

var boltCartID = '';
var boltBC;

// barrier is externally-resolved promise
var boltBarrier = function () {
    var resolveHolder;
    var isResolved = false;
    var value = null;
    var promise = new Promise(function (resolve) {
        resolveHolder = resolve;
    });
    return {
        promise: promise,
        resolve: function (t) {
            resolveHolder(t);
            value = t;
            isResolved = true;
        },
        value: function () { return value; },
        isResolved: function () { return isResolved; },
    };
};

var callConfigureWithPromises = function () {
    cartBarrier = boltBarrier();
    hintBarrier = boltBarrier();
    boltCheckoutConfigure(cartBarrier.promise, hintBarrier.promise, boltCallbacks);
}

var boltCheckoutConfigure = function (cart, hints, callback, parameters) {
    // Check if BoltCheckout is defined (connect.js executed).
    // If not, postpone processing until it is
    if (!window.BoltCheckout) {
        boltUtil.whenDefined(window, 'BoltCheckout', callConfigure, 'callConfigure');
        return;
    }
    boltBC = BoltCheckout.configure(cart, hints, callback, parameters);
}

var boltCheckoutSetup = function () {
    var createBoltOrderUrl = $('.create-bolt-order-url').val();
    var sfccBaseVersion = $('#sfccBaseVersion').val();

    $.ajax({
        url: createBoltOrderUrl,
        method: 'GET',
        success: function success(data) {
            if (data !== null && boltCartID !== data.basketID) {
                // use the response from backend to configure Bolt connect
                boltCartID = data.basketID;
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
    $('[data-tid="instant-bolt-checkout-button"]').on("click", function (event) {
        boltCheckoutSetup();
    });
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
        } else {
            callConfigureWithPromises();
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
