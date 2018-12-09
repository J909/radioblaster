'use strict';

const got = require('got');
const template = require('lodash.template');
const querystring = require('querystring');
const pkg = require('./package.json');

const metaUrlTemplate =
    template("https://musicbrainz.org/ws/2/release?query=artist:<%= artist %>%20AND%20<%= table %>:<%= title %>&limit=1&fmt=json");
const artUrlTemplate =
    template("http://coverartarchive.org/release/<%= mbid %>/front-1200");

function ArtWorker(userAgentApplication) {
  this.metaClient = got.extend({
      json: true,
      headers: {
        'user-agent': `${userAgentApplication}/${pkg.version}`
      }
    });

  this.findArtworkUrl = function(artist, title) {
    artist = querystring.escape(artist);
    title = querystring.escape(title);
    // Search for musicbrainz id for given track meta
    return this.metaClient.get(searchUrlFrom(artist, title, 'release'))
      .then(response => {
        if (!isValidResponse(response)) {
          throw new Error(unexpectedResponseStatus(response));
        }
        if (response.body.releases.length > 0) {
          return response.body.releases[0].id;
        }
        this.metaClient.get(searchUrlFrom(artist, title, 'recording'))
          .then(response => {
            if (!isValidResponse(response)) {
              throw new Error(unexpectedResponseStatus(response));
            }
            if (response.body.releases.length > 0) {
              return response.body.releases[0].id;
            }
            return null;
          });
      })
      .then(mbid => {
        // Compose artwork URI with given musicbrainz id
        if (mbid) {
          return artUrlTemplate({ mbid: mbid });
        }
        throw new Error('Cannot find metadata');
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
