'use strict';

/* API Includes */
var Site = require('dw/system/Site');
/* Script Includes */

var LogUtils = require('~/cartridge/scripts/utils/boltLogUtils');

var log = LogUtils.getLogger('BoltPreferences');
exports.BOLT_SOURCE_NAME = 'commerce_cloud';
exports.BOLT_CARTRIDGE_VERSION = '21.4.21';
/**
 * Get the custom preferences value from Business Manager
 * @returns {Object} custom preferences value object
 */

exports.getSitePreferences = function () {
    var site = Site.getCurrent(); // TODO: make v2 of these preference values https://app.asana.com/0/1201059489220902/1201809981962235

    var boltMultiPublishableKey = site.getCustomPreferenceValue('boltMultiPublishableKeyOCAPI') || '';
    var blockedCharactersList = site.getCustomPreferenceValue('blockedCharactersList') || null;

    if (boltMultiPublishableKey === '') {
        log.error('Error: Bolt publishable key configurations are missing in Business Manager.');
        return {};
    }

    var boltCdnUrl = boltConnectURL();
    return {
        boltEnable: Site.getCurrent().getCustomPreferenceValue('boltEnable'),
        boltEnableCartPage: Site.getCurrent().getCustomPreferenceValue('boltEnableCartPage') || false,
        boltMerchantDivisionID: Site.getCurrent().getCustomPreferenceValue('boltMerchantDivisionID') || '',
        boltCdnUrl: boltCdnUrl,
        boltMultiPublishableKey: boltMultiPublishableKey,
        blockedCharactersList: blockedCharactersList,
        boltEnableSessionRecording: Site.getCurrent().getCustomPreferenceValue('boltEnableSessionRecording') || false
    };
};
/**
 * Return API URL
 * @returns {string} API URL to load connect from
 */

exports.getBoltApiServiceURL = function boltApiURL() {
    var boltEnv = Site.getCurrent().getCustomPreferenceValue('boltEnvironmentOCAPI').valueOf();

    switch (boltEnv) {
        case 'sandbox':
            return 'https://api-sandbox.bolt.com';

        case 'staging':
            return 'https://api-staging.bolt.com';

        case 'production':
        default:
            return 'https://api.bolt.com';
    }
};

/**
 * Return CDN URL
 * @returns {string} CDN URL to load connect from
 */
function boltConnectURL() {
    var boltEnv = Site.getCurrent().getCustomPreferenceValue('boltEnvironmentOCAPI').valueOf();

    switch (boltEnv) {
        case 'sandbox':
            return 'https://connect-sandbox.bolt.com';

        case 'staging':
            return 'https://connect-staging.bolt.com';

        case 'production':
        default:
            return 'https://connect.bolt.com';
    }
}
