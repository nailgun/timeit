var decors = require('./decors');
var app = require('../app');
var loginRequired = decors.loginRequiredAjax;
var checkErr = require('nw.utils').checkErr;
var i18n = require('i18n');

exports.getSettings = loginRequired(function (req, res) {
    res.okJson(req.user.settings);
});

exports.setSettings = loginRequired(function (req, res, next) {
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

    req.user.save(checkErr(next, function() {
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

exports.getLanguage = function (req, res) {
    res.okJson(req.language);
};

// Translate via ajax (for locale population in development);
exports.translate = function (req, res) {
    var data = req.query;
    var singular = data.singular;
    var plural = data.plural;
    var count = data.count;

    if (!singular) {
        res.statusCode = 404;
        return res.end('Not found');
    }

    var translation;
    if (!plural) {
        translation = i18n.__(singular);
    } else {
        if (!count) {
            res.statusCode = 401;
            return res.end('Invalid count');
        }
        count = new Number(count);
        if (isNaN(count)) {
            res.statusCode = 401;
            return res.end('Invalid count');
        }
        translation = i18n.__n(singular, plural, count);
    }


    res.okJson(translation);
};
