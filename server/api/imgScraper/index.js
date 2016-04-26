'use strict';

var controller = require('./imgScraper.controller');
var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

//after user copy the pinterst url, this call will make
router.post('/scrape', auth.isAuthenticated(), controller.scrape);

module.exports = router;