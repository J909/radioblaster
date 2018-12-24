'use strict';

const express = require('express');

module.exports = (firebaseClient, radioClient, fcmTopic) => {

  let router = express.Router();

  router.get('/', (req, res) => {
    let metadata = radioClient.getPlayingMeta();
    res.send(
      '<b>RadioBlaster</b> is listening...<br>'
      + `Artist: ${metadata.artist}<br>`
      + `Title: ${metadata.title}<br>`
      + "Artwork:<br>"
      + `<img src="${metadata.artworkUrl}"/>`);
  });

  router.post('/device/:deviceId/token', (req, res, next) => {
    var deviceId = req.params.deviceId;
    console.log('/device/:deviceId/token');
    if(!req.body || !req.body.fcmToken) {
      return next({
        message: 'Bad Request',
        code: 400
      });
    }

    firebaseClient.messaging().subscribeToTopic([ req.body.fcmToken ], fcmTopic)
    .then(function(response) {
      if (response.successCount == 1) {
        console.log('Successfully subscribed to topic:', response);
        res.sendStatus(201);
      } else if (response.failureCount > 0) {
        console.log('Failed to subscribe to topic:', response.errors[0]);
        next(response.errors[0]);
      } else {
        console.log('Already subscribed...');
        res.sendStatus(200);
      }
    })
    .catch(function(error) {
      console.log('Error subscribing to FCM topic:', error);
      next({ message: 'Error subscribing to FCM topic', code: 500 });
    });
  });

  router.get('/current', (req, res, next) => {
    console.log('/current');
    let metadata = radioClient.getPlayingMeta();
    if (metadata) {
      res.json(metadata);
    } else {
      console.log('No track meta available');
      return res.sendStatus(204);
    }
  });

  return router;
}
