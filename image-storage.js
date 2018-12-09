'use strict';

const fs = require('fs');
const got = require('got');
const Storage = require('@google-cloud/storage');
const config = require('./gcloud-config');

function FileStorageClient() {
  this.store = function(readStream, filename, mimetype) {
    const storage = Storage({ projectId: config.GCLOUD_PROJECT });
    const bucket = storage.bucket(config.CLOUD_BUCKET);
    const file = bucket.file(filename);

    const writeStream = file.createWriteStream({
      metadata: {
        contentType: mimetype
      },
      resumable: false
    });

    writeStream.on('error', (err) => {
      throw new Error(err);
    });

    writeStream.on('finish', () => {
      file.makePublic().then(() => {
        return getPublicUrl(filename); 
      });
    });

    readStream.pipe(writeStream);
  }
}

function getPublicUrl(filename) {
  return `https://storage.googleapis.com/${CLOUD_BUCKET}/${filename}`;
}

module.exports = FileStorageClient;