tessel-monitor
==============

Monitor Bluetooth Low Energy advertising traffic dynamics from a [reelyActive Owl-in-One](https://www.reelyactive.com/products/gateways/#owl-in-one) based on the [Tessel 2](https://tessel.io/) platform.  Writes individual radio decodings (raddecs) and decoding statistics (CRC pass/fail) to a USB drive.

For complementary functionality, consider instead:
- [tessel-edge](https://github.com/reelyactive/tessel-edge) for real-time packet forwarding
- [tessel-roam](https://github.com/reelyactive/tessel-roam) for mobile geolocated data capture

Consult the following tutorials as step-by-step configuration guides:
- [Configure an Owl-in-One](https://reelyactive.github.io/diy/oio-config/)
- [Create a WLAN of Owl-in-Ones and a laptop](https://reelyactive.github.io/diy/oio-wlan/)


Installation
------------

Clone this repository, browse to its root, then run:

    npm install


Configuration
-------------

All configuration parameters can be found in the file __config.js__.  Update only this file, as required.

| Parameter                   | Description                                   | 
|:----------------------------|:----------------------------------------------|
| LISTEN_TO_REEL              | Enable listener on reel module (default: true)|
| LISTEN_TO_TCPDUMP           | Enable listener on tcpdump (default: false)   |
| ENABLE_MIXING               | Combine multiple decodings of an individual transmitter into a single raddec (default: true) |
| MIXING_DELAY_MILLISECONDS   | Mixing delay of radio decodings (default: 1000) |
| RADDEC_FILTER_PARAMETERS    | (see raddec-filter)                           |
| UPTIME_BEACON_SIGNATURE     | ID signature of optional Eddystone-TLM beacon |
| INCLUDE_PACKETS_IN_LOGFILE  | (default: false)                              |
| LOGFILE_NAME_PREFIX         | (default: 'monitor')                          |
| LOGFILE_EXTENSION           | (default: '.csv')                             |
| LOGFILE_DELIMITER           | (default: ',')                                |
| LOGFILE_MINUTES_TO_ROTATION | (default: 60)                                 |
| STORAGE_MOUNT_POINT         | (default: '/mnt/sda1')                        |
| IS_DEBUG_MODE               | Set true and `t2 run index.js` for console log|


Logfile Format
--------------

__tessel-monitor__ will produce two logfiles each rotation.  If the default configuration is maintained, these logfiles are as follows:

### monitor-stats-YYMMDD-HHMMSS.csv

- timestamp (UNIX Epoch in milliseconds based on network-obtained time)
- uptime (Eddystone-TLM uptime in milliseconds of optional Bluetooth beacon)
- receiverId (unique identifier of the Bluetooth reelceiver)
- uptime (reelceiver uptime in seconds, based on statistics packet)
- send count (number of radio decodings serially-forwarded by the reelceiver)
- CRC pass (number of radio decodings passing the cyclic redundancy check)
- CRC fail (number of radio decodings failing the cyclic redundancy check)

Note that the send count, CRC pass and fail are compiled over the course of one minute.  In other words, the onboard reelceiver is expected to provide one statistics packet per minute.  If the CRC pass number is greater than the send count, the difference is the number of radio decodings that the reelceiver was unable to forward over the serial link due to bandwidth constraints.

### monitor-raddec-YYMMDD-HHMMSS.csv

- timestamp (UNIX Epoch in milliseconds based on network-obtained time)
- uptime (Eddystone-TLM uptime in milliseconds of optional Bluetooth beacon)
- transmitterId (unique identifier of the transmitting device)
- transmitterIdType (see [raddec identifier types](https://github.com/reelyactive/raddec#identifier-types) )
- receiverId (unique identifier of the Bluetooth reelceiver or onboard WiFi)
- rssi (average received signal strength over the given number of decodings)
- number of decodings (within the MIXING_DELAY_MILLISECONDS)
- packets (variable length & comma-separated if INCLUDE_PACKETS_IN_LOGFILE)


Programming
-----------

Programming the Tessel 2 requires the [t2-cli](https://www.npmjs.com/package/t2-cli) package which can be installed by following [these instructions](https://tessel.github.io/t2-start/).

With the Tessel 2 connected to the programming station via USB, from the root of this repository run:

    t2 push index.js

The code will be pushed to flash memory on the Tessel and will run every time it boots.


Uptime Beacon
-------------

In the absence of a network connection (WiFi or Ethernet) providing NTP (Network Time Protocol), the Tessel will operate with an incorrect clock, which requires manual syncing of the logged timestamps, if even possible.  To counter this challenge, a Bluetooth beacon that supports Eddystone-TLM can be placed in range of the Owl-in-One, such that the uptime it transmits can be used to sync the clocks of one or more devices.

Set the UPTIME_BEACON_SIGNATURE to match the identifier of the beacon to be observed.  For instance, in the case of a Minew beacon such as the E8 ([config guide](https://reelyactive.github.io/diy/minew-e8-config/)) the signature would be 'ac233fxxxxxx/2' where the x are specific to the beacon.


Prerequisites
-------------

The __tessel-monitor__ software expects the following:
- a reel or reelceiver module connected via UART on Port A
- maximum baud rate of Port A set to at least 230400
- tcpdump installed (only if LISTEN_TO_TCPDUMP is true)


License
-------

MIT License

Copyright (c) 2022 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
