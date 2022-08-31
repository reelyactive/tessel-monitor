/*
 * Copyright reelyActive 2022
 * We believe in an open Internet of Things
 */

'use strict';

const tessel = require('tessel');
const fs = require('fs');
const path = require('path');
const Barnowl = require('barnowl');
const BarnowlReel = require('barnowl-reel');
const BarnowlTcpdump = require('barnowl-tcpdump');
const Raddec = require('raddec');
const RaddecFilter = require('raddec-filter');
const config = require('./config');

// Load the configuration parameters
const barnowlOptions = {
    enableMixing: config.enableMixing,
    mixingDelayMilliseconds: config.mixingDelayMilliseconds
};
const raddecFilterParameters = config.raddecFilterParameters;
const isDebugMode = config.isDebugMode;

// Constants
const REEL_BAUD_RATE = 230400;
const REEL_DECODING_OPTIONS = {
    maxReelLength: 1,
    minPacketLength: 8,
    maxPacketLength: 39
};
const RECEIVER_ID_TYPE_BLE = 1;  // EUI-64
const RECEIVER_ID_TYPE_WIFI = 2; // EUI-48


// Logfile and uptime are global variables
let logfile = null;
let uptimeMilliseconds = '';

// Create raddec filter
let filter = new RaddecFilter(raddecFilterParameters);

// Create barnowl instance with the configuration options
let barnowl = new Barnowl(barnowlOptions);

// Have barnowl listen for reel data, if selected in configuration
if(config.listenToReel) {
  let uart = new tessel.port['A'].UART({ baudrate: REEL_BAUD_RATE });
  barnowl.addListener(BarnowlReel, {}, BarnowlReel.EventListener,
                      { path: uart, decodingOptions: REEL_DECODING_OPTIONS });
}

// Have barnowl listen for tcpdump data, if selected in configuration
if(config.listenToTcpdump) {
  barnowl.addListener(BarnowlTcpdump, {}, BarnowlTcpdump.SpawnListener, {});
}

// Handle the raddec while pulsing the green LED
barnowl.on('raddec', function(raddec) {
  tessel.led[2].on();
  if(raddec.signature === config.uptimeBeaconSignature) {
    updateUptime(raddec.packets); 
  }
  if(filter.isPassing(raddec)) {
    writeRaddec(raddec);
  }
  tessel.led[2].off();
});

// Write the reelceiverStatistics to logfile
barnowl.on('infrastructureMessage', function(message) {
  if((message.type === 'reelceiverStatistics') && (message.uptimeSeconds > 0)) {
    writeStats(message);
  }
});

// Blue LED continuously toggles to indicate program is running
setInterval(function() { tessel.led[3].toggle(); }, 500);


/**
 * Write the given statistics to the current logfile.
 * @param {Object} stats The reelceiverStatistics to write.
 */
function writeStats(stats) {
  let timestamp = Date.now();
  let logfileRotationThreshold = timestamp -
                                 (config.logfileMinutesToRotation * 60000);
  let isNewLogfileRequired = !logfile || (logfile.lastRotationTimestamp <
                                          logfileRotationThreshold);

  if(isNewLogfileRequired) {
    createNewLogfile();
  }

  let csvLine = timestamp + config.logfileDelimiter +
                uptimeMilliseconds + config.logfileDelimiter +
                stats.receiverId + config.logfileDelimiter +
                stats.uptimeSeconds + config.logfileDelimiter +
                stats.sendCount + config.logfileDelimiter +
                stats.crcPass + config.logfileDelimiter +
                stats.crcFail + '\r\n';

  logfile.writeStreamStats.write(csvLine);
}


/**
 * Write the given raddec to the current logfile.
 * @param {Object} raddec The raddec to write.
 */
function writeRaddec(raddec) {
  let timestamp = Date.now();
  let logfileRotationThreshold = timestamp -
                                 (config.logfileMinutesToRotation * 60000);
  let isNewLogfileRequired = !logfile || (logfile.lastRotationTimestamp <
                                          logfileRotationThreshold);

  if(isNewLogfileRequired) {
    createNewLogfile();
  }

  let flatRaddec = raddec.toFlattened({ includePackets: true });
  let csvLine = timestamp + config.logfileDelimiter +
                uptimeMilliseconds + config.logfileDelimiter +
                flatRaddec.transmitterId + config.logfileDelimiter +
                flatRaddec.transmitterIdType + config.logfileDelimiter +
                flatRaddec.receiverId + config.logfileDelimiter +
                flatRaddec.rssi + config.logfileDelimiter +
                flatRaddec.numberOfDecodings;

  if(config.includePacketsInLogfile) {
    for(const packet of flatRaddec.packets) {
      csvLine += config.logfileDelimiter + packet;
    }
  }

  logfile.writeStreamRaddec.write(csvLine + '\r\n');
}


/**
 * Create a new logfile, closing the previous logfile, if applicable.
 */
function createNewLogfile() {
  let timestamp = Date.now();

  if(logfile) {
    logfile.writeStreamStats.end();
    logfile.writeStreamRaddec.end();
  }

  let filenameStats = config.logfileNamePrefix + '-stats-' +
                      createCurrentTimeString(timestamp) +
                      config.logfileExtension;
  let filenameRaddec = config.logfileNamePrefix + '-raddec-' +
                       createCurrentTimeString(timestamp) +
                       config.logfileExtension;
  let filepathStats = path.join(config.storageMountPoint, filenameStats);
  let filepathRaddec = path.join(config.storageMountPoint, filenameRaddec);
  let writeStreamStats = fs.createWriteStream(filepathStats, { flags: "a" });
  let writeStreamRaddec = fs.createWriteStream(filepathRaddec, { flags: "a" });

  logfile = {
      writeStreamStats: writeStreamStats,
      writeStreamRaddec: writeStreamRaddec,
      lastRotationTimestamp: timestamp
  }

  writeStreamStats.on('error', handleError);
  writeStreamRaddec.on('error', handleError)
}


/**
 * Update the uptime based on an Eddystone-TLM packet
 * @param {Array} packets The array of packets.
 */
function updateUptime(packets) {
  for(const packet of packets) {
    let isEddystoneTLM = (packet.substring(30, 42) === "1116aafe2000");
    if(isEddystoneTLM) {
      uptimeMilliseconds = Number.parseInt(packet.substring(58), 16) * 100;
    }
  }
}


/**
 * Return a time/date string in the form YYMMDD-HHMMSS
 * @param {Number} timestamp The timestamp as a UNIX epoch.
 * @return {String} The thirteen-digit string.
 */
function createCurrentTimeString(timestamp) {
  let date = new Date(timestamp);
  let timestring = date.getFullYear().toString().slice(-2);
  timestring += ('0' + (date.getMonth() + 1)).slice(-2);
  timestring += ('0' + date.getDate()).slice(-2);
  timestring += '-';
  timestring += ('0' + date.getHours()).slice(-2);
  timestring += ('0' + date.getMinutes()).slice(-2);
  timestring += ('0' + date.getSeconds()).slice(-2);

  return timestring;
}


/**
 * Handle the given error by blinking the red LED and, if debug mode is enabled,
 * print the error to the console.
 * @param {Object} err The error to handle.
 */
function handleError(err) {
  tessel.led[0].on();
  if(isDebugMode) {
    console.log(err);
  }
  tessel.led[0].off();
}
