"use strict";

var server = require('server');

var page = module.superModule;
server.extend(page);
/* Script Modules */

var BoltPreferences = require('int_bolt_v2/cartridge/scripts/services/utils/preferences');

var BoltCartridgeVersion = 'V2';
server.append('Show', function (req, res, next) {
  var configuration = BoltPreferences.getSitePreferences();
  res.setViewData({
    config: configuration,
    boltVersion: BoltCartridgeVersion
  });
  next();
});
module.exports = server.exports();