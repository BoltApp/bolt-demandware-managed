"use strict";

$(document).ready(function () {
  // repeat until Bolt button is created
  var boltButtonExist = setInterval(function () {
    var checkoutBoltButton = $('[data-tid="instant-bolt-checkout-button"]'); // @ts-ignore

    if (checkoutBoltButton && window.BoltCheckout && checkoutBoltButton.children()[0].nodeName === 'svg') {
      // have to check if child of this dom is svg, otherwise bolt button is not fully rendered (it's the object)
      clearInterval(boltButtonExist); // This is a temp hack to make sure default event handler that opens modal doesn't work since we open it here
      // (line 74) We need to open it here instead of relying on default button event handler since user can close
      // the modal, update cart and reopen it. The second time user opens the cart will use the previous
      // Bolt order token since configure (line 73) is not guaranteed to run before modal opens

      $('[data-tid="instant-bolt-checkout-button"]').children().replaceWith($('[data-tid="instant-bolt-checkout-button"]').children().clone());
      var createBoltOrderUrl = $('.create-bolt-order-url').val(); // add an event handler to Bolt button's click

      checkoutBoltButton.click(function () {
        // call backend to create cart in Bolt
        $.ajax({
          url: createBoltOrderUrl,
          method: 'GET',
          success: function success(data) {
            if (data !== null) {
              // use the response from backend to configure Bolt connect
              var cart = {
                id: data.basketID
              }; // @ts-ignore

              var boltButtonApp = BoltCheckout.configure(cart, data.hints, null);
              boltButtonApp.open();
            }
          }
        });
      });
    }
  }, 100);
});