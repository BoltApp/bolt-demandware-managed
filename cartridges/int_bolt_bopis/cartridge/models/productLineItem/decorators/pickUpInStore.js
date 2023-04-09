'use strict';

module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'pickUpInStore', {
        enumerable: true,
        value: lineItem.custom.pickUpInStore
    });
};
