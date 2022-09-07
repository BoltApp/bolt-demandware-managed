'use strict';

/**
 * Controller for backoffice transaction
 *
 */

/**
 * redirects to specific actions
 * */
function performAction() {
    var action = request.httpParameterMap.action.value;
    var orderNo = request.httpParameterMap.orderno.value;
    var amount = request.httpParameterMap.amount.value;

    var transActions = require('~/cartridge/scripts/transActions');

    var result;

    switch (action) {
        case 'capture':
            result = transActions.capture(orderNo, amount);
            break;

        case 'cancel':
            result = transActions.cancel(orderNo);
            break;

        case 'credit':
            result = transActions.credit(orderNo, amount);
            break;

        default:
            result = {};
    }

    var r = require('~/cartridge/scripts/util/response');

    r.renderJSON(result);
}

/*
 * Exposed web methods
 */
performAction.public = true;
exports.Action = performAction;
