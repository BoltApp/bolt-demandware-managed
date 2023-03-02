/**
 * Map of watched objects to maps of their respective watched properties to configured callbacks
 * @type {Map<Object, Map<string, function[]>>}
 */
var whenDefinedCallbacks = new Map([]);

module.exports = {
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