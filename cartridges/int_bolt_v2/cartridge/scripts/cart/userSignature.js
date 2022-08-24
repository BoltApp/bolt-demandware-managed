"use strict";

/* API Includes */
var BasketMgr = require('dw/order/BasketMgr');
/* Script Modules */


var StateCodeMap = require('~/cartridge/scripts/utils/stateCodeMap');
/**
 * Return corresponding US state full name if input address is a valid US state code
 * @param {dw.customer.CustomerAddress} address - dw customer address
 * @returns {string} US State full nmae or stateCode
 */


function convertUSStateCodeToFullName(address) {
  if (address.countryCode && address.countryCode.value === 'US' && StateCodeMap.USStateCodeMap[address.stateCode]) {
    return StateCodeMap.USStateCodeMap[address.stateCode];
  }

  return address.stateCode;
}
/**
 * Generate user signature used for prefilling Bolt checkout modal
 * @returns {Object} user signature
 */


exports.getPrefillUserSignature = function () {
  var basket = BasketMgr.getCurrentBasket();
  var customer = basket.customer,
      userSignature = {}; // eslint-disable-line

  if (!basket || !customer || !customer.authenticated) {
    return userSignature;
  }

  if (customer.addressBook && (customer.addressBook.preferredAddress || customer.addressBook.addresses.length > 0)) {
    var preferredAddress = customer.addressBook.preferredAddress ? customer.addressBook.preferredAddress : customer.addressBook.addresses[0];
    userSignature.prefill = {
      firstName: preferredAddress.firstName,
      lastName: preferredAddress.lastName,
      email: customer.profile ? customer.profile.email : '',
      phone: preferredAddress.phone,
      addressLine1: preferredAddress.address1,
      addressLine2: preferredAddress.address2,
      city: preferredAddress.city,
      state: convertUSStateCodeToFullName(preferredAddress),
      zip: preferredAddress.postalCode,
      country: preferredAddress.countryCode.value
    };
  } else if (customer.profile) {
    userSignature.prefill = {
      email: customer.profile.email,
      phone: customer.profile.phoneHome
    };
  }

  return userSignature;
};