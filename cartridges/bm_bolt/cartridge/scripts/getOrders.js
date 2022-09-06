'use strict';

// API Includes
var OrderMgr = require('dw/order/OrderMgr');

var ArrayList = require('dw/util/ArrayList');

/**
 * Get order list for custom order list page
 * @param {Object} input input object
 * @returns {Object} order details
 */
function getOrders(input) {
    var pageSize = input.pageSize;
    var pageNumber = input.pageNumber;
    var orderNumber = input.orderNumber;
    var result = new ArrayList();
    var totalOrderCount = 0;
    var startRow = 0;
    var endRow = 0;
    var rowCount = 0;
    var pageCount = 0;
    var order;
    var orders;

    if (orderNumber) {
    // searching for an order ID
        order = OrderMgr.searchOrder('custom.boltDWLinkOrderID = {0}', orderNumber);

        if (order) {
            result.push(order);
            totalOrderCount = 1;
            startRow = 1;
            endRow = 1;
        }
    } else {
    // all orders on pagination
        orders = OrderMgr.searchOrders('custom.isBoltOrder = {0}', 'creationDate desc', true);
        orders.forward((pageNumber - 1) * pageSize, pageSize);

        while (orders.hasNext()) {
            result.push(orders.next());
            rowCount++;
        }

        totalOrderCount = orders.count;
        startRow = (pageNumber - 1) * pageSize + 1;
        endRow = startRow + rowCount - 1;
        pageCount = Math.ceil(totalOrderCount / pageSize);
    }

    return {
        orders: result,
        totalOrderCount: totalOrderCount,
        startRow: startRow,
        endRow: endRow,
        pageSize: pageSize,
        pageNumber: pageNumber,
        pageCount: pageCount,
        orderNumber: orderNumber
    };
}

module.exports = {
    output: function output(input) {
        return getOrders(input);
    }
};
