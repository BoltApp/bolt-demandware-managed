'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

const MINICART = 'minicart';
const CART = 'cart';

/* Script Modules */
var BoltPreferences = require('int_bolt_core/cartridge/scripts/services/utils/preferences');


server.append('Show', function (req, res, next) {
    var configuration = BoltPreferences.getSitePreferences();
    res.setViewData({
        config: configuration,
        isPPC: false,
        component: CART
    });
    next();
});

server.append('MiniCartShow', function (req, res, next) {
    var configuration = BoltPreferences.getSitePreferences();
    res.setViewData({
        config: configuration,
        component: MINICART
    });
    next();
});

server.append('MiniCart', function (req, res, next) {
    var configuration = BoltPreferences.getSitePreferences();
    res.setViewData({
        config: configuration,
        component: MINICART
    });
    next();
});

server.get('ReloadBoltButton', function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var buttonResult = {};
    var configuration = BoltPreferences.getSitePreferences();
    var context = {
        config: configuration,
        isMiniCart: true,
        component: MINICART
    };
    buttonResult.html = renderTemplateHelper.getRenderedHtml(context, 'cart/boltButton');
    res.json(buttonResult);
    next();
});

module.exports = server.exports();
