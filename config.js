/*
 * Copyright reelyActive 2022
 * We believe in an open Internet of Things
 */


const Raddec = require('raddec');


// Begin configurable parameters
// -----------------------------

const LISTEN_TO_REEL = true;
const LISTEN_TO_TCPDUMP = false;
const ENABLE_MIXING = true;
const MIXING_DELAY_MILLISECONDS = 1000;
const RADDEC_FILTER_PARAMETERS = {
    minRSSI: -99
};
const INCLUDE_PACKETS_IN_LOGFILE = false;
const LOGFILE_NAME_PREFIX = 'monitor';
const LOGFILE_EXTENSION = '.csv';
const LOGFILE_DELIMITER = ',';
const LOGFILE_MINUTES_TO_ROTATION = 60;
const STORAGE_MOUNT_POINT = '/mnt/sda1';
const IS_DEBUG_MODE = true;

// ---------------------------
// End configurable parameters


module.exports.listenToReel = LISTEN_TO_REEL;
module.exports.listenToTcpdump = LISTEN_TO_TCPDUMP;
module.exports.enableMixing = ENABLE_MIXING;
module.exports.mixingDelayMilliseconds = MIXING_DELAY_MILLISECONDS;
module.exports.raddecFilterParameters = RADDEC_FILTER_PARAMETERS;
module.exports.includePacketsInLogfile = INCLUDE_PACKETS_IN_LOGFILE;
module.exports.logfileNamePrefix = LOGFILE_NAME_PREFIX;
module.exports.logfileExtension = LOGFILE_EXTENSION;
module.exports.logfileDelimiter = LOGFILE_DELIMITER;
module.exports.logfileMinutesToRotation = LOGFILE_MINUTES_TO_ROTATION;
module.exports.storageMountPoint = STORAGE_MOUNT_POINT;
module.exports.isDebugMode = IS_DEBUG_MODE;
