var app = require('./app')
  , url = require('url')
  , express = require('express')
  , connect = require('connect');

var BSON = require('mongodb').BSONPure;

exports.redirectRoot = function(req, res, next) {
    if (url.parse(req.url).pathname == '/' && req.originalUrl.slice(-1) != '/') {
        res.redirect('', 301);
    } else {
        next();
    }
};

exports.auth = function (req, res, next) {
    if (!req.session.userId) {
        req.user = null;
        next();
        return;
    }

    app.db.collection('accounts', function(err, accounts) {
        var ob_id = null;
        try {
            ob_id = new BSON.ObjectID(req.session.userId);
        } catch(err) {
            req.user = null;
            next();
            return;
        }

        accounts.findOne({_id: ob_id}, function(err, doc) {
            req.user = doc;
            next();
        });
    });
};
