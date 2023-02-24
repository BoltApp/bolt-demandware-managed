'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

/* Script Modules */
var BoltPreferences = require('int_bolt_core/cartridge/scripts/services/utils/preferences');

var BoltCartridgeVersion = 'V2';

server.append('Show', function (req, res, next) {
    var configuration = BoltPreferences.getSitePreferences();
    res.setViewData({
        config: configuration,
        boltVersion: BoltCartridgeVersion,
        location: 'cart'
    });
    next();
});

server.append('MiniCartShow', function (req, res, next) {
    var configuration = BoltPreferences.getSitePreferences();
    res.setViewData({
        config: configuration,
        boltVersion: BoltCartridgeVersion,
        location: 'minicart'
    });
    next();
});

module.exports = server.exports();
