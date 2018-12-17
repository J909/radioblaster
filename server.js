'use strict';

const express = require('express');
const radioBlaster = require('./radio-blaster');

/** Create the Express application. */
const app = express();

/** Start parsing of radio stream. */
radioBlaster.start();

app.get('/', (req, res) => {
  let metadata = radioBlaster.getPlayingMeta();
  res.send(
    '<b>RadioBlaster</b> is listening...<br>'
    + `Artist: ${metadata.artist}<br>`
    + `Title: ${metadata.title}<br>`
    + "Artwork:<br>"
    + `<img src="${metadata.artworkUrl}"/>`);
});

// Listen to the App Engine-specified port, or 3000 otherwise
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
  console.log(`Parsing metadata from ${radioBlaster.getStreamUrl()}...`);
});
