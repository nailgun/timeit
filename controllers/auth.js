var _ = require('underscore'),
    auth = require('../auth'),
    db = require('../db'),
    decors = require('./decors'),
    checkErr = require('nw.utils').checkErr,
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

exports.unlink = loginRequired(function (req, res, next) {
    var provider = req.body.provider;
    if (provider) {
        if (_.keys(req.user.links).length > 1) {
            var dataset = {};
            dataset['links.'+provider] = 1;

            db.User.update({
                _id: req.user._id
            }, {
                $unset: dataset
            }, checkErr(next, function () {
                delete req.user.links[provider];
                res.okJson();
            }));
        } else {
            res.errJson({reason: 'last_link'});
        }
    } else {
        res.errJson({reason: 'invalid_request'});
    }
});

exports.removeAccount = loginRequired(function (req, res, next) {
    req.user.remove(checkErr(next, function () {
        res.okJson();
    }));
});

exports.confirmAccount = loginRequired(function (req, res, next) {
    req.user.confirmed = true;
    req.user.save(checkErr(next, function () {
        res.redirect('/', 303);
    }));
}, true);
