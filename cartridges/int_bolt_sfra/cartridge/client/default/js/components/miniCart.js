'use strict';

var base = require('base/components/miniCart');

module.exports = function () {
    base();

    $('.minicart .popover').on('DOMSubtreeModified', function () {
        console.log($(this).children().length);
    });
};
