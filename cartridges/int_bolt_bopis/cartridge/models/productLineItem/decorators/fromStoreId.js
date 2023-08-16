'use strict';

module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'fromStoreId', {
        enumerable: true,
        value: lineItem.custom.fromStoreId
    });
};
