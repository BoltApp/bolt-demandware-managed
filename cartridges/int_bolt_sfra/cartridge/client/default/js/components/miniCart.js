'use strict';

var base = require('base/components/miniCart');

module.exports = function () {
    base();

    var minicartTotal = '';

    $('.minicart .popover').on('DOMSubtreeModified', function () {
        console.log($(this).children().length);
        if (document.querySelector('.minicart .popover').textContent !== '') {
            console.log(document.querySelector('.minicart .popover .minicart-footer .sub-total').textContent);
        }        
    });
};
