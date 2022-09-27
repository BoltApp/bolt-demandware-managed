'use strict';

var server = require('server');

var redirectURL = module.superModule;
server.extend(redirectURL);

// controller for verifying apple pay certificate
server.prepend('Start', server.middleware.https, function (req, res, next) {
    var utils = require('*/cartridge/scripts/services/utils/preferences');

    if (
        req.httpHeaders['x-is-path_info']
    && req.httpHeaders['x-is-path_info'] === '/.well-known/apple-developer-merchantid-domain-association.txt'
    ) {
        var appleDomainAssociation = utils.getSystemPreference('appleDeveloperMerchantidDomainAssociation');
        res.render('common/plaincontent', { Content: appleDomainAssociation });
        this.emit('route:Complete', req, res);
        return;
    }

    next();
});

module.exports = server.exports();
