'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

/* Script Modules */
var BoltPreferences = require('int_bolt_core/cartridge/scripts/services/utils/preferences');
var Constants = require('int_bolt_custom/cartridge/scripts/utils/constants');

server.append('Show', function (req, res, next) {
    var configuration = BoltPreferences.getSitePreferences();
    res.setViewData({
        config: configuration,
        boltVersion: Constants.BOLT_CARTRIDGE_V2_VERSION,
        isPPC: false
    });
    next();
});

server.append('MiniCartShow', function (req, res, next) {
    var configuration = BoltPreferences.getSitePreferences();
    res.setViewData({
        config: configuration,
        boltVersion: Constants.BOLT_CARTRIDGE_V2_VERSION,
        location: 'minicart'
    });
    next();
});

server.append('MiniCart', function (req, res, next) {
    var configuration = BoltPreferences.getSitePreferences();
    res.setViewData({
        config: configuration,
        boltVersion: Constants.BOLT_CARTRIDGE_V2_VERSION,
        location: 'minicart'
    });
    next();
});

server.get('ReloadBoltButton', function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var buttonResult = {};
    var configuration = BoltPreferences.getSitePreferences();
    var viewData = {
        config: configuration,
        boltVersion: Constants.BOLT_CARTRIDGE_V2_VERSION
    };
    buttonResult.html = renderTemplateHelper.getRenderedHtml(viewData, 'cart/checkoutButtons');
    res.json(buttonResult);
    next();
});

module.exports = server.exports();
