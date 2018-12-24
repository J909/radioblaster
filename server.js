'use strict';

const express = require('express');
const radioClient = require('./radio-blaster');
const firebaseClient = require('firebase-admin');
const firebaseServiceAccount = require('./firebase-service-account.json');
const bodyParser = require('body-parser');

const fcmTopic = process.env.RADIO_STATION_KEY;
const radioName = process.env.RADIO_STATION_NAME;

/** Initialize firebase API client. */
firebaseClient.initializeApp({
  credential: firebaseClient.credential.cert(firebaseServiceAccount)
});

/** Start parsing of radio stream. */
radioClient.start();
radioClient.onTrackUpdate(metadata => {
  console.log('Publishing track metadata:', metadata);
  
  var trackUpdateMessage = {
    data: metadata,
    topic: fcmTopic,
    android: {
      ttl: 0,
      priority: 'high'
    }
  };

  // Send a track metadata to devices subscribed to the FCM topic.
  firebaseClient
    .messaging()
    .send(trackUpdateMessage)
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully published message:', response);
    })
    .catch((error) => {
      console.log('Error publishing to topic:', error);
    });
});

/** Create the Express application. */
const app = express();
app.set('trust proxy', true);
app.use(bodyParser.json()); // support json bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use('/', require('./routes')(firebaseClient, radioClient, fcmTopic));

/** Express' final error handler. */
app.use(function(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }
  if(error.code && error.code >= 99 && error.code <= 599) {
    return res.status(error.code).send(error);
  } else {
    return next(error);
  }
});

// Listen to the App Engine-specified port, or 3000 otherwise
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
  console.log(`Parsing metadata from ${radioClient.getStreamUrl()}...`);
});
