'use strict';

module.exports = {
    setShippingMethodSelection: function () {
        $('body').on('setShippingMethodSelection', function (e, basket) {
            if (basket.disableShippingMethod === '') {
                $('#shippingMethods').removeAttr('disabled');
            }
        });
    }
};
