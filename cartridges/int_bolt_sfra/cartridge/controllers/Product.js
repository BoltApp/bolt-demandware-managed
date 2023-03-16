'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

/* Script Modules */
var BoltPreferences = require('int_bolt_core/cartridge/scripts/services/utils/preferences');

server.append('Show', function (req, res, next) {
    var configuration = BoltPreferences.getSitePreferences();
    var isPPCEnabledForProduct = configuration.boltEnablePPC; // TODO: @var Also check if current product is allow/deny list.
    res.setViewData({
        config: configuration,
        renderBoltPPCButton: isPPCEnabledForProduct
    });
    next();
});

module.exports = server.exports();
