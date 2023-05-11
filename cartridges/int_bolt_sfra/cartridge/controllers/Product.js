'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

/* Script Modules */
var BoltPreferences = require('int_bolt_core/cartridge/scripts/services/utils/preferences');

server.append('Show', function (req, res, next) {
    var configuration = BoltPreferences.getSitePreferences();
    // TODO: Check if product is available in the inventory.
    var productAvailable = true;
    // TODO: @var Also check if current product is allow/deny list.
    var productIsNotInDenyList = true;
    var renderBoltPPCButton = configuration.boltEnablePPC && productAvailable && productIsNotInDenyList;
    res.setViewData({
        config: configuration,
        renderBoltPPCButton: renderBoltPPCButton
    });
    next();
});

module.exports = server.exports();
