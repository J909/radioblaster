'use strict';

const moment = require('moment');
const RadioParser = require('icecast-parser');
const cloneDeep = require('lodash.clonedeep');
const ArtWorker = require('./artworker');
const FileStorageClient = require('./image-storage');

let radioblaster = {};

const userAgentApplication = process.env.USER_AGENT_APPLICATION;
const radioStreamUrl = process.env.RADIO_STREAM_URL;
const radioParser = new RadioParser({
    url: radioStreamUrl,
    keepListen: false,
    autoUpdate: true,
    errorInterval: 10 * 60, // 10 min connection retry
    emptyInterval: 5 * 60, // 5 min back off
    metadataInterval: 5 // update metadata after 5 seconds
});
const artWorker = new ArtWorker(userAgentApplication);

let currentMeta = {};

radioblaster.start = function() {
  let currentTitle;
  radioParser.on('metadata', function(metadata) {
    if (metadata.StreamTitle && (currentTitle !== metadata.StreamTitle)) {
      currentTitle = metadata.StreamTitle;
      updateCurrentMeta(currentTitle);
    }
  });
  radioParser.on('error', function(error) {
    log(error);
  });
}

radioblaster.getStreamUrl = function() {
  return radioParser.getConfig('url');
}

radioblaster.getCurrentMeta = function() {
  return cloneDeep(currentMeta);
}

function updateCurrentMeta(currentTitle) {
  var metaParts = currentTitle.split(' - ');
  if (metaParts.length > 1) {
    currentMeta = {
      'artist': sanitize(metaParts[0]),
      'title': sanitize(metaParts[1]),
      'artworkUrl': ""
    };
    log(JSON.stringify(currentMeta));
    artWorker.findArtworkUrl(currentMeta.artist, currentMeta.title)
    .then(artworkUrl => {
      log(artworkUrl);
      currentMeta.artworkUrl = artworkUrl;
    })
    .catch(error => {
      log(error);
    });
  } else {
    currentMeta = {
      'title': currentTitle
    };
    log(currentTitle);
  }
}

function sanitize(text) {
  return text.replace(/[\u{FFF0}-\u{FFFF}]/gu, "");
}

function log(message) {
  let time = new moment().format("HH:mm:ss");
  console.log(`${time}: `, message);
}

module.exports = radioblaster;
