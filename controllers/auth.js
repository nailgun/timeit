var _ = require('underscore'),
    app = require('../app'),
    auth = require('../auth'),
    decors = require('./decors'),
    utils = require('../utils'),
    noErr = utils.noErr,
    loginRequired = decors.loginRequiredAjax;

exports.status = function (req, res) {
    if (req.user) {
        if (req.user.confirmed) {
            res.okJson('ok');
        } else {
            res.okJson('not_confirmed');
        }
    } else {
        res.okJson('not_logged_in');
    }
};

exports.links = loginRequired(function (req, res) {
    var result = {
        linked: [],
        not_linked: [],
    };
    _.each(auth.providers(), function (provider) {
        if (provider in req.user.links) {
            result.linked.push(provider);
        } else {
            result.not_linked.push(provider);
        }
    });

    res.okJson(result);
});

exports.providers = function (req, res) {
    res.okJson(auth.providers());
};

// TODO: delete account if no links
exports.unlink = loginRequired(function (req, res) {
    var provider = req.body.provider;
    if (provider) {
        app.db.collection('accounts', noErr(function(accounts) {
            var dataset = {};
            dataset['links.'+provider] = 1;

            accounts.update({
                _id: req.user._id
            }, {
                $unset: dataset
            }, {
                safe: true,
            }, noErr(function () {
                res.okJson();
            }));
        }));
    } else {
        res.errJson({reason: 'no provider'});
    }
});

exports.confirmAccount = loginRequired(function (req, res) {
    app.db.collection('accounts', noErr(function(accounts) {
        accounts.update({
            _id: req.user._id
        }, {
            $set: {
                confirmed: true
            }
        }, {
            safe: true,
        }, noErr(function () {
            res.okJson();
        }));
    }));
}, true);
