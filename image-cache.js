'use strict';

const fs = require('fs');
const got = require('got');
const Storage = require('@google-cloud/storage');
const CryptoJS = require('crypto-js');
const Base62 = require("base62/lib/ascii");

function ImageCache(projectId, bucketId, salt) {
  const storage = Storage({ projectId: projectId });
  const bucket = storage.bucket(bucketId);

  this.store = function(readStream, key, mimetype) {
    return new Promise((resolve, reject) => {
      const cacheId = getCacheId(key, salt);
      const file = bucket.file(cacheId);

      const writeStream = file.createWriteStream({
        metadata: {
          contentType: mimetype
        },
        resumable: false
      });

      writeStream.on('error', error => {
        reject(error);
      });

      writeStream.on('finish', () => {
        file.makePublic().then(() => {
          resolve(getPublicUrl(bucketId, cacheId));
        });
      });

      readStream.pipe(writeStream);
    });
  };

  this.find = function(key) {
    return new Promise((resolve, reject) => {
      const cacheId = getCacheId(key, salt);
      bucket.file(cacheId).exists()
      .then(function(data) {
        const exists = data[0];
        if (exists) {
          resolve(getPublicUrl(bucketId, cacheId));
        } else {
          resolve();
        }
      })
      .catch(error => {
        reject(error);
      });
    });
  }
}

function getPublicUrl(bucketId, cacheId) {
  return `https://storage.googleapis.com/${bucketId}/${cacheId}`;
}

function getCacheId(key, salt) {
  return Base62.encode(
    parseInt(
      CryptoJS.SHA3(key + salt, {
        outputLength: 224
      }).toString(CryptoJS.enc.Hex), 16));
}

module.exports = ImageCache;
