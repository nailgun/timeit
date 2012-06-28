var utils = require('../utils'),
    app = require('../app'),
    url = require('url'),
    auth = require('../auth'),
    decors = require('./decors'),
    loginRequired = decors.loginRequired;

exports.activity = require('./activity');
exports.auth = require('./auth');
exports.stats = require('./stats');
exports.aux = require('./aux');

exports.index = loginRequired(function(req, res) {
    app.renderer.renderToRes(res, 'index.html');
});

exports.login = function(req, res) {
    app.renderer.renderToRes(res, 'login.html', {
        providers: auth.providers()
    });
};

exports.getConfirm = loginRequired(function(req, res) {
    app.renderer.renderToRes(res, 'confirm.html', {
        _csrf: req.session._csrf
    });
}, true);

exports.postConfirm = loginRequired(function (req, res) {
    req.user.confirmed = true;
    req.user.save(utils.noErr(function () {
        res.redirect('/', 302);
    }));
}, true);
