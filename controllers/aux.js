var decors = require('./decors');
var app = require('../app');
var loginRequired = decors.loginRequiredAjax;
var noErr = require('../utils').noErr;

exports.getSettings = loginRequired(function (req, res) {
    res.okJson(req.user.settings);
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
        req.user.settings.username = username;
    }
    if (notifications !== undefined) {
        req.user.settings.notifications = parseInt(notifications) ? true : false;
    }

    req.user.save(noErr(function() {
        res.okJson();
    }));
});

exports.getCsrfToken = function(req, res) {
    res.json(req.session._csrf);
};

exports.getVersion = function(req, res) {
    res.okJson(app.version);
};

exports.getMessages = function (req, res) {
    var messages = req.session.messages || [];
    req.session.messages = [];

    if (req.user) {
        messages.concat(req.user.messages);

        req.user.messages = [];
        req.user.save();
    }

    res.okJson(messages);
};
