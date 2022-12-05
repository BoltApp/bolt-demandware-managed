'use strict';

/* API Includes */
var Site = require('dw/system/Site');

/* Script Includes */
var LogUtils = require('~/cartridge/scripts/utils/boltLogUtils');
var log = LogUtils.getLogger('BoltPreferences');
var System = require('dw/system/System');

exports.BOLT_SOURCE_NAME = 'commerce_cloud';
exports.BOLT_CARTRIDGE_VERSION = '2.1.0';

/**
 * Get the custom preferences value from Business Manager
 * @returns {Object} custom preferences value object
 */
exports.getSitePreferences = function () {
    var site = Site.getCurrent();

    var boltMultiPublishableKey = 'xucIhuC7kR07.FljG3LVceZat.4e91eb678c187f0820a3ce27fc87b684f0d2797bf3439d5b34da164ff4e27771';// site.getCustomPreferenceValue('boltMultiPublishableKeyOCAPI') || '';
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
        boltEnableSessionRecording: Site.getCurrent().getCustomPreferenceValue('boltEnableSessionRecording') || false,
        sfccBaseVersion: getSFCCBaseVersion()
    };
};

/**
 * Return API URL
 * @returns {string} API URL to load connect from
 */
exports.getBoltApiServiceURL = function boltApiURL() {
    return 'https://api.derrick.dev.bolt.me';
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
    return 'https://connect.derrick.dev.bolt.me';
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

/**
 * Checks whether a system preference is defined or not.
 * return the preference value if defined, otherwise null
 * @param {string} preferenceID - global custom preference id
 * @returns {Object} global custom preference
 */
exports.getSystemPreference = function (preferenceID) {
    if (!(preferenceID in System.getPreferences().getCustom())) {
        return null;
    }
    return System.getPreferences().getCustom()[preferenceID];
};

/**
 * Returns the first digit configured in SFCC base version. "6.1.2" returns 6
 * @returns {number} the first number
 */
function getSFCCBaseVersion() {
    var version = 5;
    var sfccBaseVersion = Site.getCurrent().getCustomPreferenceValue('sfccBaseVersion');
    if (empty(sfccBaseVersion)) {
        return baseVersion;
    }

    var baseVersion = sfccBaseVersion.split('.');
    if (!empty(baseVersion)) {
        version = parseInt(baseVersion[0], 10);
    }

    return version;
}
