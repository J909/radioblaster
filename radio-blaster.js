'use strict';

const moment = require('moment');
const RadioParser = require('icecast-parser');
const cloneDeep = require('lodash.clonedeep');

let radioblaster = {};

const radioParser = new RadioParser({
    url: process.env.RADIO_STREAM_URL,
    keepListen: false,
    autoUpdate: true,
    errorInterval: 10 * 60, // 10 min connection retry
    emptyInterval: 5 * 60, // 5 min back off
    metadataInterval: 5 // update metadata after 5 seconds
});

let currentMeta = {};

radioblaster.start = function() {
	let currentTitle;
	radioParser.on('metadata', function(metadata) {
	    if (currentTitle !== metadata.StreamTitle) {
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
			'artist': metaParts[0],
			'title': metaParts[1] 
		};
		logMeta(currentMeta);
	} else {
		currentMeta = null;
		log(currentTitle);
	}
}

function logMeta(meta) {
	let time = new moment().format("HH:mm:ss");
	console.log(time + ': Artist=' + meta['artist'] + ' Title=' + meta['title']);
}

function log(message) {
	let time = new moment().format("HH:mm:ss");
	console.log(time + ': ', message);
}

function logBlip() {
	process.stdout.write(".");
}

module.exports = radioblaster;