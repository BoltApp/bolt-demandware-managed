'use strict';

var base = require('base/components/miniCart');
var bolt = require('../bolt');

/**
 * Using Mutation Observers to Watch for Element Availability and change.
 */
/* eslint-disable */
! function (win) {
    var doc = win.document;
    var MutationObserver = win.MutationObserver || win.WebKitMutationObserver;
    var data_listeners = [];
    var data_observer;

    /**
     * @param {Object} selector the selector
     * @param {Object} fn the fn property is just an alias to the prototype property
     */
    function data_change(selector, fn) {
        // Store the selector and callback to be monitored
        data_listeners.push({
            selector: selector,
            fn: fn
        });
        if (!data_observer) {
            // Watch for data changes in the document
            data_observer = new MutationObserver(check_data);
            var config = {
                characterData: true,
                subtree: true,
                childList: true
            };
            data_observer.observe(doc.documentElement, config);
        }
    }

    function check_data() {
        // Check the DOM for elements matching a stored selector
        for (var i = 0, len = data_listeners.length, listener, elements; i < len; i++) {
            listener = data_listeners[i];
            // Query for elements matching the specified selector
            elements = doc.querySelectorAll(listener.selector);
            for (var j = 0, jLen = elements.length, element; j < jLen; j++) {
                element = elements[j];
                // Invoke the callback with the element
                listener.fn.call(element, element);
            }
        }
    }
    // Expose methods
    win.onDataChange = data_change;
}(window);
/* eslint-enable */

module.exports = function () {
    base();
    var minicartTotal = '';
    onDataChange('.minicart .popover', function(element) {
        if (element.textContent !== '') {
            var subTotalElement = document.querySelector('.minicart .popover .minicart-footer .sub-total');
            if (subTotalElement !== null && subTotalElement.textContent && subTotalElement.textContent !== minicartTotal) {
                if (minicartTotal === '') {
                    bolt.initBoltMiniCartButton();
                } else {
                    $.ajax({
                        url: $('#bolt-minicart-btn').data('action-url'),
                        data: {},
                        method: 'GET',
                        success: function (response) {
                            $('#bolt-minicart-btn').empty();
                            $('#bolt-minicart-btn').replaceWith(response.html);
                        }
                    });
                }
                console.log(subTotalElement.textContent);
                minicartTotal = subTotalElement.textContent;
            }
        }
    });
};
