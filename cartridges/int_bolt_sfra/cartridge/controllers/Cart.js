'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

const BOLTMINICART = 'minicart';
const BOLTCART = 'cart';

/* Script Modules */
var BoltPreferences = require('int_bolt_core/cartridge/scripts/services/utils/preferences');
var configuration = BoltPreferences.getSitePreferences();

server.append('Show', function (req, res, next) {
    res.setViewData({
        config: configuration,
        isPPC: false,
        component: BOLTCART
    });
    next();
});

server.append('MiniCartShow', function (req, res, next) {
    res.setViewData({
        config: configuration,
        component: BOLTMINICART
    });
    next();
});

server.append('MiniCart', function (req, res, next) {
    res.setViewData({
        config: configuration,
        component: BOLTMINICART
    });
    next();
});

server.get('ReloadBoltButton', function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var buttonResult = {};
    var context = {
        config: configuration,
        isMiniCart: true,
        component: BOLTMINICART
    };
    buttonResult.html = renderTemplateHelper.getRenderedHtml(context, 'cart/boltButton');
    res.json(buttonResult);
    next();
});

module.exports = server.exports();
