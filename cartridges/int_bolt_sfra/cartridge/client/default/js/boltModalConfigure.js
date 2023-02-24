'use strict';

var initializeButton = require('./initializeBoltButton');

$(document).ready(function () {
    // repeat until Bolt button is created
    var cartButton = $('.bolt-cart');
    if (cartButton.length > 0) {
        initializeButton(cartButton);
    }
});
