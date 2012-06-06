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

exports.csrf = function(options) {
    function defaultValue(req) {
        return (req.body && req.body._csrf)
            || (req.query && req.query._csrf)
            || (req.headers['x-csrf-token']);
    }

    function defaultSafeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    var options = options || {},
        value = options.value || defaultValue,
        safeMethod = options.safeMethod || defaultSafeMethod;

    return function(req, res, next) {
        var token = req.cookies._csrf || (req.cookies._csrf = connect.utils.uid(24));
        res.cookie('_csrf', token);

        if (safeMethod(req.method)) {
            return next();
        }

        var val = value(req);
        if (val != token) {
            return next(connect.utils.error(403));
        }

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
