"use strict";

/**
 * Bolt Transaction Actions
 */

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');

var Transaction = require('dw/system/Transaction');

var Resource = require('dw/web/Resource');
/* Script Modules */


var Utils = require('*/cartridge/scripts/util/boltUtils');

var LogUtils = require('*/cartridge/scripts/util/boltLogUtils');

var log = LogUtils.getLogger('TransActions');
var authorizedStatus = 'authorized';
var completedStatus = 'completed';
/**
 * Call action
 * @param {string} endPoint - api URL
 * @param {Object} request - request object
 * @returns {Object} response
 */

function callAction(endPoint, request) {
  var response = Utils.restAPIClient('POST', endPoint, JSON.stringify(request));
  return response;
}
/**
 * Updates the order status
 * @param {string} orderNo - order no
 */


function updateOrderStatus(orderNo) {
  var Order = OrderMgr.getOrder(orderNo);

  try {
    if (Order) {
      Transaction.begin();
      Order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
      Order.setStatus(Order.ORDER_STATUS_CANCELLED);
      Order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
      Transaction.commit();
    }
  } catch (e) {
    Transaction.rollback();
    log.error('Exception occured while updating the order status after Refund Transaction' + e);
  }
}
/**
 * Keeps the transaction details in order custom attributes and history
 * @param {string} action - transaction action
 * @param {Object} order - order object
 * @param {Object} response -response object
 * @param {number} paidAmount - paid amount
 */


function setOrderAttributesHistory(action, order, response, paidAmount) {
  var transactionHistory = order.custom.boltTransactionHistory || '[]';
  var captureAmount = order.custom.boltCaptureAmount;
  var amount;

  if (action === 'capture') {
    if (response.capture && response.capture.amount && response.capture.amount.amount) {
      amount = response.capture.amount.amount / 100;
    } else if (response.amount && response.amount.amount) {
      amount = response.amount.amount / 100;
    } else {
      amount = 0.0;
    }

    captureAmount += amount;
    paidAmount = order.custom.boltPaidAmount + paidAmount; // eslint-disable-line no-param-reassign
  } else {
    amount = response.amount && response.amount.amount ? response.amount.amount / 100 : 0.0;
  }

  transactionHistory = JSON.parse(transactionHistory);
  transactionHistory.push({
    id: response.id || '',
    reference: response.reference || '',
    type: response.type || '',
    status: response.status || '',
    amount: amount,
    action: action,
    date: new Date().getTime()
  });
  Transaction.begin();
  order.custom.boltTransactionID = response.id || ''; // eslint-disable-line no-param-reassign

  order.custom.boltTransactionReference = response.reference || ''; // eslint-disable-line no-param-reassign

  order.custom.boltTransactionType = response.type || ''; // eslint-disable-line no-param-reassign

  order.custom.boltTransactionStatus = response.status || ''; // eslint-disable-line no-param-reassign

  order.custom.boltCaptureAmount = captureAmount; // eslint-disable-line no-param-reassign

  order.custom.boltPaidAmount = paidAmount; // eslint-disable-line no-param-reassign

  order.custom.boltTransactionHistory = JSON.stringify(transactionHistory); // eslint-disable-line no-param-reassign

  Transaction.commit();
}
/**
 * generate Void Request
 * @param {string} transactionReference - transaction ID
 * @returns {Object} transaction object
 */


function makeVoidRequest(transactionReference) {
  return {
    transaction_reference: transactionReference || ''
  };
}
/**
 * Cancel(void) operation
 * @param {string} orderNo - order no
 * @returns {Object} response
 */


function cancel(orderNo) {
  var order = OrderMgr.searchOrder('custom.boltDWLinkOrderID = {0}', orderNo);
  var endPoint = Resource.msg('api.transaction.void', 'bolt', null);
  var transactionReference;
  var status;
  var error;

  try {
    transactionReference = order.custom.boltTransactionReference || '';
    var request = makeVoidRequest(transactionReference);
    log.debug('Void request: ' + JSON.stringify(request));
    var response = callAction(endPoint, request);
    log.debug('Void response: ' + LogUtils.maskCustomerData(response));

    if (response && response.status && response.status === 'error') {
      status = false;
      var hasErrMessage = response.errors && response.errors[0] && response.errors[0].message;
      error = hasErrMessage ? response.errors[0].message : '';
    } else if (response) {
      status = true;
      var paidAmount = order.custom.boltPaidAmount;
      setOrderAttributesHistory('void', order, response, paidAmount);
      updateOrderStatus(orderNo);
    }
  } catch (e) {
    log.error('Exception occurred: ' + e.message);
    var bolt = {
      orderReference: orderNo,
      boltTransactionReference: transactionReference
    };
    Utils.bugsnagException(e, null, bolt, null);
  }

  return {
    status: status,
    error: error
  };
}
/**
 * Generate Capture Request
 * @param {Object} order - order object
 * @param {number} amount - capture amount
 * @param {string} transactionReference - transaction id
 * @returns {Object} transaction details
 */


function makeCaptureRequest(order, amount, transactionReference) {
  var currency = order.getCurrencyCode();
  amount = Math.round(amount * 100); // eslint-disable-line no-param-reassign

  return {
    transaction_reference: transactionReference,
    amount: amount,
    currency: currency
  };
}
/**
 * Capture action
 * @param {string} orderNo - order no
 * @param {string} inputAmount - capture amount
 * @returns {Object} response
 */


function capture(orderNo, inputAmount) {
  var order = OrderMgr.searchOrder('custom.boltDWLinkOrderID = {0}', orderNo);
  var transactionHistory;
  var status = false;
  var transactionReference;
  var request;
  var error;
  var amount;

  try {
    amount = parseFloat(inputAmount);
    transactionHistory = order.custom.boltTransactionHistory || '[]';
    transactionHistory = JSON.parse(transactionHistory);

    for (var i = 0; i < transactionHistory.length; i++) {
      if (transactionHistory[i].status === authorizedStatus) {
        transactionReference = transactionHistory[i].reference;
      }
    }

    request = makeCaptureRequest(order, amount, transactionReference);
    log.debug('Capture request: ' + JSON.stringify(request));
    var endpointURL = Resource.msg('api.transaction.capture', 'bolt', null);
    var response = callAction(endpointURL, request);
    log.debug('Capture response: ' + LogUtils.maskCustomerData(response));

    if (response && response.status && response.status === 'error') {
      status = false;
      var hasErrMessage = response.errors && response.errors[0] && response.errors[0].message;
      error = hasErrMessage ? response.errors[0].message : '';
    } else if (response) {
      status = true;
      var paidAmount = amount;
      setOrderAttributesHistory('capture', order, response, paidAmount);
    }
  } catch (e) {
    log.error('Exception occurred: ' + e.message);
    var boltJSON = [];

    for (var j = 0; j < transactionHistory.length; j++) {
      boltJSON.push({
        orderReference: transactionHistory[j].reference,
        transactionType: transactionHistory[j].type,
        boltTransactionID: transactionHistory[j].id,
        boltTransactionStatus: transactionHistory[j].status,
        amount: transactionHistory[j].amount,
        date: transactionHistory[j].date
      });
    }

    var bolt = boltJSON;
    Utils.bugsnagException(e, null, bolt, null);
  }

  return {
    status: status,
    error: error
  };
}
/**
 * Generate credit Request
 * @param {Object} order - order object
 * @param {number} amount - refund amount
 * @param {string} transactionReference - transaction id
 * @returns {Object} transaction details
 */


function makeCreditRequest(order, amount, transactionReference) {
  var currency = order.getCurrencyCode();
  amount = Math.round(amount * 100); // eslint-disable-line no-param-reassign

  return {
    transaction_reference: transactionReference,
    amount: amount,
    currency: currency
  };
}
/**
 * Credit action
 * @param {string} orderNo - order no
 * @param {string} amount - refund amount
 * @returns {Object} response
 */


function credit(orderNo, amount) {
  var order = OrderMgr.searchOrder('custom.boltDWLinkOrderID = {0}', orderNo);
  var endPoint = Resource.msg('api.transaction.credit', 'bolt', null);
  var status = false;
  var transactionHistory;
  var transactionReference;
  var error;
  var creditAmount;

  try {
    creditAmount = parseFloat(amount);
    transactionHistory = order.custom.boltTransactionHistory || '[]';
    transactionHistory = JSON.parse(transactionHistory);

    for (var i = 0; i < transactionHistory.length; i++) {
      if (transactionHistory[i].status === completedStatus || transactionHistory[i].status === authorizedStatus) {
        transactionReference = transactionHistory[i].reference; // We go through statuses in order of ingestion.
        // We do not want the last one because if a partial refund has occured the status will be completed.

        break;
      }
    }

    var request = makeCreditRequest(order, creditAmount, transactionReference);
    log.debug('Refund request: ' + JSON.stringify(request));
    var response = callAction(endPoint, request);
    log.debug('Refund response: ' + LogUtils.maskCustomerData(response));

    if (response && response.status && response.status === 'error') {
      status = false;
      var hasErrMessage = response.errors && response.errors[0] && response.errors[0].message;
      error = hasErrMessage ? response.errors[0].message : '';
    } else if (response) {
      status = true;
      var paidAmount = parseFloat(order.custom.boltPaidAmount) - creditAmount;
      paidAmount = Utils.round(paidAmount);
      setOrderAttributesHistory('credit', order, response, paidAmount);

      if (paidAmount === 0) {
        updateOrderStatus(orderNo);
      }
    }
  } catch (e) {
    log.error('Exception occurred: ' + e.message);
    var boltJSON = [];

    for (var j = 0; j < transactionHistory.length; j++) {
      boltJSON.push({
        orderReference: transactionHistory[j].reference,
        transactionType: transactionHistory[j].type,
        boltTransactionID: transactionHistory[j].id,
        boltTransactionStatus: transactionHistory[j].status,
        amount: transactionHistory[j].amount,
        date: transactionHistory[j].date
      });
    }

    var bolt = boltJSON;
    Utils.bugsnagException(e, null, bolt, null);
  }

  return {
    status: status,
    error: error
  };
}

exports.capture = function (orderNo, amount) {
  return capture(orderNo, amount);
};

exports.credit = function (orderNo, amount) {
  return credit(orderNo, amount);
};

exports.cancel = function (orderNo) {
  return cancel(orderNo);
};