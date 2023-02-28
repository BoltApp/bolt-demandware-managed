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
        isPPC: true
    });
    next();
});

module.exports = server.exports();
