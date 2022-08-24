"use strict";

/**
 * Controller for Order management pages
 *
 */

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');

var ISML = require('dw/template/ISML');
/**
 * Bolt Order List page
 * */


function orderList() {
  var pageSize = request.httpParameterMap.pagesize.value;
  var pageNumber = request.httpParameterMap.pagenumber.value;
  var orderNumber = request.httpParameterMap.ordernumber.value || '';
  var orderListResponse;
  pageSize = pageSize ? parseInt(pageSize, 10) : 10;
  pageNumber = pageNumber ? parseInt(pageNumber, 10) : 1;
  orderListResponse = require('~/cartridge/scripts/getOrders').output({
    pageSize: pageSize,
    pageNumber: pageNumber,
    orderNumber: orderNumber
  });
  ISML.renderTemplate('application/orderlist', orderListResponse);
}
/**
 * Bolt Order Details page
 * */


function orderDetails() {
  var resourceHelper = require('~/cartridge/scripts/util/resource');

  var utils = require('*/cartridge/scripts/util/boltUtils');

  var orderNo = request.httpParameterMap.OrderNo.stringValue;
  var order = OrderMgr.getOrder(orderNo);
  var dueAmount = utils.round(order.getTotalGrossPrice().value - (order.custom.boltPaidAmount || 0.0));
  var paidAmount = utils.round(order.custom.boltPaidAmount || 0.0);
  var authAmount = utils.round(order.custom.boltAuthAmount || 0.0);
  var captureAmount = utils.round(order.custom.boltAuthAmount - order.custom.boltCaptureAmount) || 0.0;
  var transactionHistory = order.custom.boltTransactionHistory || '[]';
  ISML.renderTemplate('application/orderdetails', {
    resourceHelper: resourceHelper,
    order: order,
    transactionHistory: transactionHistory,
    dueAmount: dueAmount,
    paidAmount: paidAmount,
    authAmount: authAmount,
    captureAmount: captureAmount
  });
}
/**
 * Bolt document
 * */


function documentation() {
  ISML.renderTemplate('application/documentation');
}
/**
 * Exposed web methods
 */


orderList["public"] = true;
orderDetails["public"] = true;
documentation["public"] = true;
exports.OrderList = orderList;
exports.OrderDetails = orderDetails;
exports.Documentation = documentation;