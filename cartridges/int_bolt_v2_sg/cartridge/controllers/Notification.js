"use strict";

/* eslint-disable eqeqeq */

/**
 * Notification Controller - Send notification
 *
 * @module  controllers/Notification
 */

/* API Includes */
var Resource = require('dw/web/Resource');
/* Script Modules */


var guard = require('*/cartridge/scripts/guard');

var r = require('*/cartridge/scripts/util/Response');

var Email = require('*/cartridge/scripts/models/EmailModel');

var LogUtils = require('int_bolt_v2/cartridge/scripts/utils/boltLogUtils');

var BoltHttpUtils = require('int_bolt_v2/cartridge/scripts/services/utils/httpUtils');

var PaymentHelper = require('int_bolt_v2/cartridge/scripts/checkout/paymentProcessor');

var log = LogUtils.getLogger('Notification');
/**
 * Endpoint to send order confirmation email
 */

function orderConfirmEmail() {
  var ORDER_STATUS_NEW = dw.order.Order.ORDER_STATUS_NEW; // eslint-disable-line no-undef

  var ORDER_STATUS_OPEN = dw.order.Order.ORDER_STATUS_OPEN; // eslint-disable-line no-undef

  var resJSONBody = {
    action: request.httpPath.split('/').pop(),
    queryString: request.httpQueryString,
    locale: request.locale // eslint-disable-line prettier/prettier

  };

  try {
    var errorMessage = '';

    if (!BoltHttpUtils.getAuthenticationStatus()) {
      errorMessage = Resource.msg('request.not.authenticated', 'error', null);
      respondError(resJSONBody, errorMessage, 401);
      return;
    }

    var requestBody = BoltHttpUtils.getBoltRequestBody();
    var orderID = requestBody.order_id;
    var order = dw.order.OrderMgr.getOrder(orderID); // eslint-disable-line no-undef

    if (order === null || order.getCustomerEmail() === null) {
      errorMessage = Resource.msg('order.or.email.notfound', 'error', null);
      respondError(resJSONBody, errorMessage, 404);
      return;
    } // Only pass orders in status 'new' and 'open'. Orders in other status should be ignored.


    if (order.status != ORDER_STATUS_NEW && order.status != ORDER_STATUS_OPEN) {
      errorMessage = Resource.msgf('order.status.incorrect', 'error', null, order.status);
      respondError(resJSONBody, errorMessage, 406);
      return;
    }

    Email.sendMail({
      template: 'mail/orderconfirmation',
      recipient: order.getCustomerEmail(),
      subject: Resource.msg('order.orderconfirmation-email.001', 'order', null),
      context: {
        Order: order // eslint-disable-line prettier/prettier

      } // eslint-disable-line prettier/prettier

    });
    response.setStatus(200);
    resJSONBody.status = 'success';
    r.renderJSON(resJSONBody);
    return;
  } catch (e) {
    respondError(resJSONBody, e.message || '', 500);
  }
}
/**
 * Set payment processor for alternative payment methods.
 */


function APMProcessor() {
  var resJSONBody = {
    action: request.httpPath.split('/').pop(),
    queryString: request.httpQueryString
  };

  try {
    if (!BoltHttpUtils.getAuthenticationStatus()) {
      var errorMessage = Resource.msg('request.not.authenticated', 'error', null);
      respondError(resJSONBody, errorMessage, 401);
      return;
    }

    var req = BoltHttpUtils.getBoltRequestBody();
    var status = PaymentHelper.setPaymentProcessor(req.order_id || '', req.processor);

    if (status.error) {
      respondError(resJSONBody, status.message, 406);
      return;
    }

    response.setStatus(200);
    resJSONBody.status = 'success';
    r.renderJSON(resJSONBody);
    return;
  } catch (e) {
    respondError(resJSONBody, e.message || '', 500);
  }
}
/* eslint-disable no-param-reassign */

/**
 * Set response to fail, log and return error message
 * @param {Object} resJSONBody - response body
 * @param {string} errorMessage - error message
 * @param {string} statusCode - status code
 */


function respondError(resJSONBody, errorMessage, statusCode) {
  log.error(errorMessage);
  response.setStatus(statusCode);
  resJSONBody.status = 'error';
  resJSONBody.message = errorMessage;
  r.renderJSON(resJSONBody);
}
/*
 * Web exposed methods
 */

/** @see {@link module:controllers/Notification~OrderConfirmEmail} */


exports.OrderConfirmEmail = guard.ensure(['post'], orderConfirmEmail);
/** @see {@link module:controllers/Notification~SetPaymentProcessor} */

exports.APMProcessor = guard.ensure(['post'], APMProcessor);