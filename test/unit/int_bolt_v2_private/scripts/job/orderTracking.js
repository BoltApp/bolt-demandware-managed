/* eslint-disable */
var chai = require('chai');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var ArrayList = require('../../../../mocks/dw.util.Collection.js');
var Status = require('../../../../mocks/dw/system/Status.js')

describe('orderTracking', function () {
    var path = '../../../../../cartridges/int_bolt_v2_private/cartridge/scripts/job/orderTracking.js';
    var emptyFunction = function () {};
    var returnFirstArg = function (arg) {
      return arg;
    }
    var pathStub = {
        'dw/system/Transaction': {
            begin: emptyFunction,
            wrap: returnFirstArg,
            commit: emptyFunction,
            rollback: emptyFunction,
        },
        'dw/system/Logger': {
            debug: returnFirstArg,
            error: returnFirstArg,
            info: returnFirstArg,
        },
        'dw/order/Order':{
            ORDER_STATUS_OPEN: 4,
            ORDER_STATUS_NEW: 3,
        },
        'dw/order/OrderMgr': {},
        'dw/web/Resource': {
            msg() {
              return 'someString';
            },
            msgf() {
              return 'someString';
            },
        },
        'dw/svc/Result': {
            OK: 'OK',
            ERROR: 'ERROR',
        },
        'dw/system/Status': Status,
        '~/cartridge/scripts/ordertracking/boltOrderTracking': {
            boltOrderTracking() {
                return {
                    status: 'ok',
                    errors: [],
                }
            },
        },
        'int_bolt_v2/cartridge/scripts/utils/boltLogUtils': {
            getLogger() {
                return {
                  debug() {},
                  error() {},
                  info() {},
                };
              },
        }
    };

    it('orderTracking job should return error if no order found', function () {
        pathStub['dw/order/OrderMgr'].searchOrders = function(){
            return {
                asList() {
                  return {
                    toArray() {
                      return [];
                    }
                  }
                }
            };
        }

        var orderTrackingJob = proxyquire(path, pathStub);
        var response = orderTrackingJob.orderTracking({});
        expect(response.status).to.be.equal(1);
    });

    it('orderTracking job should return error if specified order id is not valid', function () {
        pathStub['dw/order/OrderMgr'].getOrder = function(){
            return null;
        }

        var orderTrackingJob = proxyquire(path, pathStub);
        var response = orderTrackingJob.orderTracking({});
        expect(response.status).to.be.equal(1);
    });

    it('orderTracking job should not return error if tracking info is sent successfully', function () {
        pathStub['dw/order/OrderMgr'].getOrder = function(){
            return {
                orderNo: "111111",
                getAllProductLineItems() {
                    return new ArrayList([
                        {
                            product: {
                                name: 'test product name',
                                ID: 'test product id',
                            }
                        },
                    ]);
                },
                getDefaultShipment() {
                    return {
                        trackingNumber: "EZ1000000001",
                        setTrackingNumber() {},
                    }
                }
            }
        };
        var context = {
            totalOrders: 1,
            orderId: "111111",
        }

        var orderTrackingJob = proxyquire(path, pathStub);
        var response = orderTrackingJob.orderTracking(context);
        expect(response.status).to.be.equal(0);
    });
});
