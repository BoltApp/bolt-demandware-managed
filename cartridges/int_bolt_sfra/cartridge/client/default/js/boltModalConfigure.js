'use strict';

var bolt = require('./bolt');

$(document).ready(function () {
    bolt.initBoltButton();
    // ignore the following line if not using ApplePay
    bolt.addApplePayHandlerIfNeeded();
});
