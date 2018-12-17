'use strict';

const got = require('got');
const template = require('lodash.template');
const querystring = require('querystring');

const metaUrlTemplate =
    template("https://musicbrainz.org/ws/2/release?query=artist:<%= artist %>%20AND%20<%= table %>:<%= title %>&limit=1&fmt=json");
const artUrlTemplate =
    template("http://coverartarchive.org/release/<%= mbid %>/front");

function ArtWorker(userAgent) {
  this.metaClient = got.extend({
      json: true,
      headers: {
        'user-agent': userAgent
      }
    });

  this.findArtworkUrl = function(artist, title) {
    artist = querystring.escape(artist);
    title = querystring.escape(title);
    // Search for musicbrainz release for given track meta
    return this.metaClient.get(searchUrlFrom(artist, title, 'release'))
      .then(response => {
        if (!isValidResponse(response)) {
          throw new Error(unexpectedResponseStatus(response));
        }
        if (response.body.releases.length > 0) {
          return new Promise((resolve, reject) => resolve(response));
        }
        // Fall back to search for recording instead of release
        return this.metaClient.get(searchUrlFrom(artist, title, 'recording'));
      })
      .then(response => {

        if (!isValidResponse(response)) {
          throw new Error(unexpectedResponseStatus(response));
        }
        if (response.body.releases.length > 0) {
          return response.body.releases[0].id;
        }
        return null;
      })
      .then(mbid => {
        // Compose artwork URI with given musicbrainz id
        if (mbid) {
          return artUrlTemplate({ mbid: mbid });
        }
        throw new Error(`Found neither release nor recording :(`);
      });
  }
}

function searchUrlFrom(artist, title, table) {
  let url = metaUrlTemplate({
    'artist': artist,
    'title': title,
    'table': table
  });
  console.log(url);
  return url;
}

function artUrlFrom(mbid) {
  let url = artUrlTemplate({
    'mbid': mbid
  });
  console.log(url);
  return url;
}

function isValidResponse(response) {
  return response.statusCode === 200 && response.body && response.body.releases;
}

function unexpectedResponseStatus(response) {
  return `Unexpected response: ${response.url}: ${response.statusCode}: ${response.statusMessage}`;
}

module.exports = ArtWorker;
