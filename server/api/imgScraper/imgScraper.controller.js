'use strict';

var scrapers = {};

scrapers['pinterest'] = require('./scrapers/pinterest.js');
//scrapers['instgram'] = require('./scrapers/instgram.js');


exports.scrape = function(req, res) {
  var url = req.body.url;//user provide
  var scraperToUse;

  if(url.indexOf('pinterest') > -1) {
    scraperToUse = 'pinterest';
  } else {
    console.log('cannot locate scraper');
  }

  scrapers[scraperToUse].list(url, function(data) {
    console.log('data from scraper: ', data);
    res.json(data);
  });
}