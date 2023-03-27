'use strict';

var base = require('base/components/miniCart');

module.exports = function () {
    base();

    var minicartTotal = '';

    $('.minicart .popover').on('DOMSubtreeModified', function () {
        if (document.querySelector('.minicart .popover').textContent !== '') {
            var subTotalElement = document.querySelector('.minicart .popover .minicart-footer .sub-total');
            if (subTotalElement !== null && subTotalElement.textContent && subTotalElement.textContent !== minicartTotal) {
                // do something;
                console.log(subTotalElement.textContent);
                console.log(minicartTotal);
                minicartTotal = subTotalElement.textContent;
            }
        }
    });
};
