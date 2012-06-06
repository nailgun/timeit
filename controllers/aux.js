var decors = require('./decors');
var app = require('../app');
var loginRequired = decors.loginRequiredAjax;
var noErr = require('../utils').noErr;

exports.getSettings = loginRequired(function (req, res) {
    app.db.collection('accounts', noErr(function(accounts) {
        accounts.find({
            _id: req.user._id,
        }, ['settings']).toArray(noErr(function(docs) {
            var settings = docs ? docs[0].settings || {} : {};
            res.json(settings);
        }));
    }));
});

exports.setSettings = loginRequired(function (req, res) {
    try {
        var username = req.body['username'];
        var notifications = req.body['notifications'];
        if (username !== undefined && !username) {
            throw 'no username';
        }
    } catch(err) {
        res.statusCode = 400;
        res.json({result: 'error', message: 'invalid_request'});
        return;
    }

    var dataset = {};
    if (username) {
        dataset['settings.username'] = username;
    }
    if (notifications !== undefined) {
        dataset['settings.notifications'] = parseInt(notifications) ? true : false;
    }

    app.db.collection('accounts', noErr(function(accounts) {
        accounts.update({
            _id: req.user._id,
        }, {
            $set: dataset
        }, {
            safe: true
        }, noErr(function() {
            res.json({result: 'done'});
        }));
    }));
});

exports.getCsrfToken = function(req, res) {
    res.json(req.session._csrf);
};
