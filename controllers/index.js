var utils = require('../utils'),
    app = require('../app'),
    url = require('url'),
    auth = require('../auth'),
    decors = require('./decors'),
    loginRequired = decors.loginRequired;

exports.activity = require('./activity');
exports.auth = require('./auth');
exports.aux = require('./aux');

exports.index = loginRequired(function(req, res) {
    res.render('index.html');
});

exports.login = function(req, res) {
    res.render('login.html', {
        providers: auth.providers()
    });
};

exports.confirm = loginRequired(function(req, res) {
    res.render('confirm.html');
}, true);
