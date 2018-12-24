'use strict';

const moment = require('moment');
const RadioParser = require('icecast-parser');
const cloneDeep = require('lodash.clonedeep');
const ArtWorker = require('./artworker');
const ImageCache = require('./image-cache');
const got = require('got');
const pkg = require('./package.json');

/** Initialize radio stream parser. */
const radioStreamUrl = process.env.RADIO_STREAM_URL;
const radioParser = new RadioParser({
    url: radioStreamUrl,
    keepListen: false,
    autoUpdate: true,
    errorInterval: 10 * 60, // 10 min connection retry
    emptyInterval: 5 * 60, // 5 min back off
    metadataInterval: 5 // update metadata after 5 seconds
});

/** Initialize coverart search client. */
const userAgent = getUserAgent();
const artWorker = new ArtWorker(userAgent);

/** Initialize image cache. */
const projectId = process.env.GCLOUD_PROJECT;
const bucketId = process.env.CLOUD_BUCKET;
const salt = process.env.SALT;
const imageCache = new ImageCache(projectId, bucketId, salt);

let playingMeta = {};
let onTrackUpdateListener;

function updatePlayingMeta(currentTitle) {
  let metaParts = currentTitle.split(' - ');
  if (metaParts.length > 1) {
    setPlayingMeta(sanitize(metaParts[1]), sanitize(metaParts[0]));
    let newMeta = getPlayingMeta();

    artWorker.findArtworkUrl(newMeta.artist, newMeta.title)
    .then(artworkUrl => {
      log(`Validating artwork URL: ${artworkUrl}`);
      return got.head(artworkUrl, {
        "user-agent": userAgent
      })
      .catch(error => {
        if (error.statusCode === 404) {
          throw new Error(`Artwork not found`);
        }
        console.log(`Failed to validate artwork URL: ${error.statusCode} ${error.statusMessage}`);
        throw new Error(error);
      });
    })
    .then(response => {
      let contentType = response.headers['content-type'];
      if (!isValidContentType(contentType)) {
        throw new Error(`Invalid artwork content-type: ${contentType}`);
      }
      newMeta.artworkUrl = response.url;
      newMeta.artworkContentType = contentType;

      log(`Caching artwork from ${response.url} ...`);
      return imageCache.find();
    })
    .then(artworkUrl => {
      if (!artworkUrl) {
        return imageCache.store(
          got.stream(newMeta.artworkUrl, {
            "user-agent": userAgent
          }),
          currentTitle,
          newMeta.artworkContentType);
      }
      return new Promise((resolve, reject) => resolve(artworkUrl));
    })
    .then(publicUrl => {
      newMeta.artworkUrl = publicUrl;
      playingMeta = newMeta;
      onTrackUpdateListener(playingMeta);
    })
    .catch(error => {
      log(error);
      onTrackUpdateListener(playingMeta);
    });
  } else {
    setPlayingMeta(currentTitle, "");
    onTrackUpdateListener(playingMeta);
  }
}

function getPlayingMeta() {
  return cloneDeep(playingMeta);
}

function setPlayingMeta(title, artist) {
  playingMeta = {
      'title': title,
      'artist': artist,
      'artworkUrl': "",
      'artworkContentType': ""
    };
}

function isValidContentType(contentType) {
  console.log("Artwork Content-Type:", contentType);
  return contentType === "image/png" || contentType === "image/jpeg";
}

function sanitize(text) {
  return text.replace(/[\u{FFF0}-\u{FFFF}]/gu, "");
}

function getUserAgent() {
  let userAgent = `${process.env.USER_AGENT_APPLICATION}/${pkg.version} (${process.env.USER_AGENT_OWNER})`;
  log(`User-Agent: ${userAgent}`);
  return userAgent;
}

function log(message) {
  let time = new moment().format("HH:mm:ss");
  console.log(`${time}: `, message);
}

module.exports = {
  'start': () => {
    let currentTitle;
    radioParser.on('metadata', function(metadata) {
      if (metadata.StreamTitle && (currentTitle !== metadata.StreamTitle)) {
        currentTitle = metadata.StreamTitle;
        updatePlayingMeta(currentTitle);
      }
    });
    radioParser.on('error', function(error) {
      log(error);
    })
  },
  'getPlayingMeta': getPlayingMeta,
  'getStreamUrl': () => radioParser.getConfig('url'),
  'onTrackUpdate': listener => onTrackUpdateListener = listener
};
