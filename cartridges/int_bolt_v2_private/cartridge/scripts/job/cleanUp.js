'use strict';

/* API Includes */
var File = require('dw/io/File');
/* Script Includes */

var logUtils = require('int_bolt_v2/cartridge/scripts/utils/boltLogUtils');

var log = logUtils.getLogger('BoltCatalogExportJob');

/**
 * Deletes all files that have not been
 * modified within the days paramater.
 * @param {dw.util.Map} context job context
 * @returns {boolean} true if all the files that should be deleted are deleted
 * false if any of the files are not deleted
 */
function cleanUp(context) {
    var clearUpDays = new Number(context.days); // eslint-disable-line no-new-wrappers

    if (isNaN(clearUpDays)) {
        return false;
    }

    var deletionSucceeded = true;

    if (context.filePath === null || context.filePath.length === 0) {
        throw Error('file path is not specified.');
    }

    var catalogFiles = new File(File.IMPEX + context.filePath).listFiles();

    for (var i = 0; i < catalogFiles.length; i++) {
        if (catalogFiles[i].lastModified() < Date.now() - clearUpDays * 24 * 60 * 60 * 1000) {
            if (!catalogFiles[i].remove()) {
                log.error('Failed to delete file '.concat(catalogFiles[i].getName()));
                deletionSucceeded = false;
            }
        }
    }

    return deletionSucceeded;
}

exports.cleanUp = cleanUp;
