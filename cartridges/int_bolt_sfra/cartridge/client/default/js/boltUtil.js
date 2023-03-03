/**
 * Map of watched objects to maps of their respective watched properties to configured callbacks
 * @type {Map<Object, Map<string, function[]>>}
 */
var whenDefinedCallbacks = new Map([]);

/**
 * BoltState contains all global variables we need for interaction between
 * this module and extensions.
 */
var BoltState = {
    /**
     * @var bool true if the Bolt checkout button is already initiated
     */
    BoltCheckBtnInitiated: false

};

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

module.exports = {
    BoltState,
    /**
     * Executes provided callback when a property gets defined on provided object.
     * The most common use is waiting for a variable to be defined by an external library
     * using {@see window} as {@see object}
     *
     * @param {Object} object to check for property definition
     * @param {number|string} property that is expected to be defined on {@see object}
     * @param {Function} callback function to be called when {@see property} gets defined on {@see object}
     * @param {null} key deprecated parameter used for setting multiple callbacks per property
     */
    whenDefined: function (object, property, callback, key = null) {
        if (object.hasOwnProperty(property)) {
            callback();
        } else {
            var overloadedPropertyName = '_' + property;
            if (!whenDefinedCallbacks.has(object)) {
                whenDefinedCallbacks.set(object, new Map([]));
            }
            if (!whenDefinedCallbacks.get(object).has(property)) {
                whenDefinedCallbacks.get(object).set(property, []);
            }
            var propertyCallbacks = whenDefinedCallbacks.get(object).get(property);
            propertyCallbacks.push(callback);
            Object.defineProperty(object, property, {
                configurable: true,
                enumerable: true,
                writeable: true,
                /**
                 * Retrieves the watched property from overloaded index
                 *
                 * @returns {*} {@see property} value on {@see object}
                 */
                get: function () {
                    return this[overloadedPropertyName];
                },
                /**
                 * Sets the overloaded property index with the provided value then executes configured callbacks
                 *
                 * @param {mixed} value
                 */
                set: function (value) {
                    this[overloadedPropertyName] = value;
                    for (var propertyCallback of propertyCallbacks.values()) {
                        propertyCallback();
                    }
                }
            });
        }
    }
};
