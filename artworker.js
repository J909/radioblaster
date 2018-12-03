'use strict';

const got = require('got');
const template = require('lodash.template');
const querystring = require('querystring');
const pkg = require('./package.json');

function ArtWorker(userAgentApplication) {
  this.userAgent = `${userAgentApplication}/${pkg.version}`;
  this.metaUrlTemplate =
    template("https://musicbrainz.org/ws/2/release?query=artist:<%= artist %>%20AND%20release:<%= title %>&limit=1&fmt=json");
	this.artUrlTemplate =
    template("http://coverartarchive.org/release/<%= mbid %>/front");
  this.metaClient = got.extend({
      json: true,
      headers: {
        'user-agent': this.userAgent
      }
    });

  console.log('this.userAgent=' + this.userAgent);
}

ArtWorker.prototype.findArtworkUrl = function(artist, title) {
  let metaUrl = this.metaUrlTemplate({
    artist:querystring.escape(artist),
    title:querystring.escape(title)
  });
  console.log(`GET release: ${metaUrl}`);
  // Find musicbrainz id for given track meta
  return this.metaClient.get(metaUrl)
    .then(response => {
      if (response.statusCode !== 200 || !response.body || !response.body.releases) {
        throw new Error(`Unexpected response from ${metaUrl}: ${response.statusCode}: ${response.statusMessage}`);
      }
      if (response.body.releases.length > 0) {
        return response.body.releases[0].id;
      }
      throw new Error("No releases found");
    })
    .then(mbid => {
      // Compose artwork URI with given musicbrainz id
      if (mbid) {
        return this.artUrlTemplate({ mbid: mbid });
      }
      throw new Error('Missing mbid');
    });
}

module.exports = ArtWorker;
