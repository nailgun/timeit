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
            res.okJson(settings);
        }));
    }));
});

exports.setSettings = loginRequired(function (req, res) {
    var username = req.body['username'];
    var notifications = req.body['notifications'];
    if (username === '') {
        res.errJson({
            field_errors: {
                username: ['this is required']
            }
        });
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
            res.okJson();
        }));
    }));
});

exports.getCsrfToken = function(req, res) {
    res.json(req.session._csrf);
};

exports.getVersion = function(req, res) {
    res.okJson(app.version);
};
