'use strict';

var _ = require('lodash');
var Look = require('./look.model');
var path = require('path');
var express = require('express');
var utils = require('../../utils/utils.js');
var config = require('../../config/environment');
var knox = require('knox');
var fs = require('fs');
var os = require('os');
var formidable = require('formidable');
var gm = require('gm');
    

var knoxClient = knox.createClient({
	key: config.S3AccessKey,
	secret: config.S3Secret,
	bucket: config.S3Bucket
})

exports.allLooks = function(req, res) {
  Look.find({})
    .sort({
      createTime: -1
    })
    .exec(function(err, looks) {
      if (err) {
        return handleError(res, err);
      }
      if (!looks) {
        return res.send(404);
      }
//      console.log(looks);
      return res.status(200)
                     .json(looks);
    });
};

exports.userLooks = function(req, res) {
  var userEmail = req.query.email;
  Look.find({
    email: {
      $in: userEmail
    }
  })
  .sort({
    createTime: -1
  })
  .exec(function(err, looks) {
    if(err) {
      return handleError(res, err);
    }
    console.log(looks);
    return res.status(200)
                   .json(looks);
  });
};

exports.scrapeUpload = function(req, res) {
  
    var random = utils.randomizer(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

  utils.downloadURI(req.body.image, '../client/assets/images/uploads/' + random + '.png', function(filename) {
      
    console.log('done');

    var newLook = new Look();
    newLook.title = req.body.title;
    newLook.image = filename.slice(9);
    newLook.email = req.body.email;
    newLook.linkURL = req.body.linkURL;
    newLook.description = req.body.description;
    newLook.userName = req.body.name;
    newLook._creator = req.body._creator;
    newLook.createTime = Date.now();
    newLook.upVotes = 0;
    newLook.save(function(err, item) {
      if (err) {
        console.log('error occured in saving post');
      } else {
        console.log('Success post saved');
        console.log(item);
        res.status(200)
          .json(item);
      }
    });
  });
}


exports.scrapeUpload2 = function(req, res) {
  
    var newLook = new Look();
    newLook.title = req.body.title;
    newLook.image = req.body.image;
    newLook.email = req.body.email;
    newLook.linkURL = req.body.linkURL;
    newLook.description = req.body.description;
    newLook.userName = req.body.name;
    newLook._creator = req.body._creator;
    newLook.createTime = Date.now();
    newLook.upVotes = 0;
    newLook.save(function(err, item) {
      if (err) {
        console.log('error occured in saving post');
      } else {
        console.log('Success post saved');
        console.log(item);
        res.status(200)
          .json(item);
      }
    });
  };


exports.upload = function(req, res) {
  var newLook = new Look();
  var fileimage = req.middlewareStorage.fileimage;
//  console.log(fileimage);
//  console.log(req.body);
  newLook.image = '/assets/images/uploads/' + fileimage;
  newLook.email = req.body.email;
  newLook.linkURL = req.body.linkURL;
  newLook.title = req.body.title;
  newLook.description = req.body.description;
  newLook.userName = req.body.name;
  newLook._creator = req.body._creator;
  newLook.createTime = Date.now();
  newLook.upVotes = 0;

  newLook.save(function(err, look) {
    if(err) {
      console.log('error saving look');
      return res.send(500);
    } else {
      console.log(look);
      res.status(200)
           .send(look);
    }
  });
};


exports.upload2 = function(req, res){
	console.log("body");
    console.log(req.body);
	var tmpFile, nfile, fname;
	var newForm = new formidable.IncomingForm();
    newForm.keepExtensions = true;
    newForm.parse(req, function(err, fields, files){
        tmpFile = files.upload.path;
        fname = files.upload.name;
        nfile = os.tmpDir() + '/' + fname;
        res.writeHead(200, {'Content-type':'text/plain'});
        res.end();
    })

	
    newForm.on('end', function(){
        console.log("tempFile: "+ tmpFile);
        console.log("nfile: "+ nfile);
        console.log("fname: "+ fname);

        fs.rename(tmpFile, nfile, function(){
            // Resize the image and upload this file into the S3 bucket
            gm(nfile).resize(300).write(nfile, function(){
                // Upload to the S3 Bucket
                fs.readFile(nfile, function(err, buf){
                    var req = knoxClient.put(fname, {
                        'Content-Length':buf.length,
                        'Content-Type':'image/jpeg'
                    })

                    req.on('response', function(res){
                        if(res.statusCode == 200){
                            var newLook = new Look();
                            newLook.image = 'https://d14rdkekk76br1.cloudfront.net/'+fname;
                            newLook.save();
                            console.log(newLook);
                            
                            // Delete the Local File
                            fs.unlink(nfile, function(){
                                console.log('Local File Deleted !');
                            })

                        }
                    })

                    req.end(buf);
                })
            })
        })
    })
};


exports.singleLook = function(req, res) {
  Look.findById(req.params.lookId, function(err, look) {
    if(err) {
      return handleError(res, err);
    }
    if(!look) {
      return res.send(404);
    }
    return res.json(look);
  });
};

exports.update = function(req, res) {
  if(req.body._id) {
    delete req.body._id;
  }
  Look.findById(req.params.id, function(err, look) {
    if(err) {
      return handleError(res, err);
      }
      if(!look) {
        return res.send(404);
      }
      var updated = _.merge(look, req.body);
      updated.save(function(err) {
        if(err) {
          return handleError(res, err);
        }
        console.log(look);
        return res.json(look);
      });
  });
};
exports.popLooks = function(req, res) {
  Look.find(req.params.id)
    .sort('-upVotes') // get max number
    .limit(6)
    .exec(function(err, looks) {
      if (err) {
        return handleError(res, err);
      }
      console.log(looks);
      return res.json(looks);
    });
};
exports.delete = function(req, res) {
  Look.findById(req.params.id, function(err, look) {
    if(err) {
      return handleError(res, err);
    }
    if(!look) {
      return res.send(404);
    }
    look.remove(function(err) {
      if(err) {
        return handleError(res, err);
      }
      return res.send(200);
    });
  });
};

exports.addView = function(req, res) {
  Look.findById(req.params.id, function(err, look) {
    if(err) {
      return handleError(res, err);
    }
    if (!look) {
      return res.send(404);
    }
    look.views++;
    look.save(function(err) {
      if (err) {
        return handle(res, err);
      }
      return res.json(look);
    });
  });
};

exports.addUpvote = function(req, res) {
  Look.findById(req.params.id, function(err, look) {
    if(err) {
      return handleError(res, err);
    }
    if(!look) {
      return res.send(404);
    }
    look.upVotes++;
    look.save(function(err) {
      if(err) {
        return handleError(res, err);
      }
      return res.json(look);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}