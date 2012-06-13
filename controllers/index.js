var utils = require('../utils'),
    app = require('../app'),
    url = require('url');

exports.activity = require('./activity');
exports.auth = require('./auth');
exports.stats = require('./stats');
exports.aux = require('./aux');

exports.index = function(req, res) {
    app.renderer.renderToRes(res, 'index.html');
};

exports.asset = function(req, res) {
    var pathname = url.parse(req.url).pathname;
    var assetName = pathname.slice(1);

    app.assetStore.getContent(assetName, utils.noErr(function (content) {
        res.header('Content-Type', app.assetStore.getContentType(assetName));
        res.end(content);
    }));
};
