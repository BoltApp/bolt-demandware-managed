'use strict';

/**
 * Utility functions for API service
 */

/* eslint-disable no-shadow */

/* API Includes */
var Site = require('dw/system/Site');
var Mac = require('dw/crypto/Mac');
var Encoding = require('dw/crypto/Encoding');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var HttpResult = require('dw/svc/Result');

/* Script Includes */
var boltPreferences = require('~/cartridge/scripts/services/utils/preferences');
var LogUtils = require('~/cartridge/scripts/utils/boltLogUtils');
var commonUtils = require('~/cartridge/scripts/utils/commonUtils');
var log = LogUtils.getLogger('HttpUtils');

exports.HTTP_METHOD_POST = 'POST';

/**
 * Get bolt request body
 * @returns {Object} bolt request object
 */
exports.getBoltRequestBody = function () {
    var req;

    try {
        var httpParameterMap = request.getHttpParameterMap();
        var requestBody = httpParameterMap.get('requestBodyAsString') ? httpParameterMap.requestBodyAsString : null;
        var blockedCharactersList = Site.getCurrent().getCustomPreferenceValue('blockedCharactersList') || null;
        var denyList = null;

        if (blockedCharactersList) {
            denyList = new RegExp(blockedCharactersList, 'g');
        }

        req = JSON.parse(requestBody);

        // filter out emojis (usually present in values)
        Object.keys(req).map(function (key) {
            req[key] = commonUtils.sanitizeInput(req[key], denyList);
            return null;
        });
    } catch (e) {
        req = null;
        log.error('Invalid JSON bolt request. Error:' + e.message);
    }

    return req;
};

/**
 * Check authentication code
 * @returns {boolean} authentication status
 */
exports.getAuthenticationStatus = function () {
    var strAuth = request.getHttpHeaders().get('x-bolt-hmac-sha256');
    var httpParameterMap = request.getHttpParameterMap();
    var requestBody = httpParameterMap.get('requestBodyAsString') ? httpParameterMap.requestBodyAsString : null;
    var boltSigningSecret = Site.getCurrent().getCustomPreferenceValue('boltSigningSecret') || '';

    if (!strAuth) {
        log.error('Missing authorization key on request header');
        return false;
    }

    if (!boltSigningSecret) {
        log.error("Missing custom preference value for 'Access Token Secret'");
        return false;
    }

    var mac = new Mac(Mac.HMAC_SHA_256);
    var sha = mac.digest(requestBody, boltSigningSecret);
    var hmac = Encoding.toBase64(sha);
    return hmac === strAuth;
};

/**
 * Communicates with Bolt APIs
 * @param {string} method - web service method
 * @param {string} endPoint - Bolt API url
 * @param {Object} request - request object
 * @param {string} requestContentType - content type
 * @param {string} fullUrlOverride - service endpoint
 * @returns {ServiceResponse} service response
 */
exports.restAPIClient = function (method, endPoint, request, requestContentType, fullUrlOverride) {
    var contentType = requestContentType || 'application/json';
    var service = LocalServiceRegistry.createService('bolt.http', {
        createRequest: function createRequest(service, args) {
            service.URL = args.endPointUrl;
            service.setRequestMethod(args.method);
            service.addHeader('Content-Type', contentType);
            service.addHeader('X-Api-Key', args.boltAPIKey);
            service.addHeader('Content-Length', args.request.length);
            service.addHeader('X-Nonce', new Date().getTime());
            service.addHeader('X-Bolt-Source-Name', boltPreferences.BOLT_SOURCE_NAME);
            service.addHeader('X-Bolt-Source-Version', boltPreferences.BOLT_CARTRIDGE_VERSION);
            return args.request;
        },
        parseResponse: serviceParseResponse,
        getRequestLogMessage: function getRequestLogMessage(request, requestContentType) {
            if (requestContentType !== 'application/json') {
                return request;
            }

            return request ? LogUtils.maskCustomerData(JSON.parse(request)) : JSON.stringify({});
        },
        getResponseLogMessage: function getResponseLogMessage(response) {
            return LogUtils.maskCustomerData(JSON.parse(response.text));
        }
    });
    var config = getConfiguration();
    var endPointUrl = config.boltAPIBaseURLV1 + endPoint;
    request = request || '';
    var serviceArgs = {
        method: method,
        endPointUrl: fullUrlOverride || endPointUrl,
        request: request,
        boltAPIKey: config.boltAPIKey
    };
    var result = service.call(serviceArgs);

    if (result && result.status === HttpResult.OK) {
        return {
            status: HttpResult.OK,
            errors: [],
            result: result.object
        };
    }

    log.error('Error on Service execution: ' + result);

    if (result.errorMessage) {
        try {
            var responseError = JSON.parse(result.errorMessage);
            return {
                status: HttpResult.ERROR,
                errors: responseError.errors || [new Error('Service execution failed with no error message')],
                result: null
            };
        } catch (e) {
            return {
                status: HttpResult.ERROR,
                errors: [new Error('Failed to parse error messages from service response')],
                result: null
            };
        }
    } else {
        return {
            status: HttpResult.ERROR,
            errors: [new Error('Service execution failed with no error message')],
            result: null
        };
    }
};

/**
 * HTTPService configuration parseResponse
 * @param {Object} _service - HTTP service
 * @param {Object} httpClient - HTTP client
 * @returns {string | null} success or null
 */
function serviceParseResponse(_service, httpClient) {
    var resp;

    if (httpClient.statusCode === 200 || httpClient.statusCode === 201) {
        resp = JSON.parse(httpClient.getText());
    } else {
        log.error('Error on http request:' + httpClient.getErrorText());
    }

    return resp;
}

/**
 * Get the configuration settings from Business Manager
 * @returns {Object} configuration object
 */
function getConfiguration() {
    var site = Site.getCurrent();
    var boltSigningSecret = site.getCustomPreferenceValue('boltSigningSecret') || '';
    var boltAPIKey = site.getCustomPreferenceValue('boltAPIKey') || '';
    var boltPartnerMerchant = site.getCustomPreferenceValue('boltPartnerMerchant').valueOf() || '';

    if (boltAPIKey === '' || boltSigningSecret === '') {
        log.error('Error: Bolt Business Manager configurations are missing.');
    }

    var baseAPIUrl = boltPreferences.getBoltApiServiceURL();
    return {
        boltSigningSecret: boltSigningSecret,
        boltAPIKey: boltAPIKey,
        boltPartnerMerchant: boltPartnerMerchant,
        boltAPIbaseURL: baseAPIUrl,
        boltAPIBaseURLV1: baseAPIUrl + '/v1'
    };
}

/**
 * Set response to fail, log and return error message
 * @param {Object} res - response object
 * @param {string} errorMessage - error message
 * @param {string} statusCode - status code
 */
exports.respondError = function (res, errorMessage, statusCode) {
    log.error(errorMessage);
    response.setStatus(statusCode);
    res.json({
        status: 'error',
        message: errorMessage
    });
};
