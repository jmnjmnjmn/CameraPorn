'use strict';

var controller = require('./look.controller');
var express = require('express');
var router = express.Router();
var auth = require('../../auth/auth.service');

router.post('/scrapeUpload', auth.isAuthenticated(), controller.scrapeUpload);
router.get('/getAllLooks', controller.allLooks);
router.post('/upload', auth.isAuthenticated(), controller.upload);

module.exports = router;