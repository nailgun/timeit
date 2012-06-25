var express = require('express'),
    async = require('async'),
    url = require('url'),
    path = require('path'),
    MongoStore = require('connect-mongodb'),
    utils = require('./utils'),
    noErr = utils.noErr,
    fs = require('fs'),
    db = require('./db'),
    cache = require('./cache'),
    ContentCache = require('./content_cache'),
    AssetStore = require('./asset_store'),
    template = require('./template'),
    context_extensions = require('./context_extensions'),
    assets = require('./assets');

var app = module.exports = express.createServer();
app.configure = configureApplication;

if (require.main === module) {
    main();
}

function main() {
    var configPath = process.argv[2];
    if (!configPath) {
        console.error('USAGE: app.js CONFIG.JSON');
        process.exit(1);
    }

    configPath = path.resolve(process.cwd(), configPath);

    var server = express.createServer();
    app.configure(require(configPath), function() {
        server.use(app.installation.pathname, app);
        if (!app.config.listen_port) {
            app.config.listen_port = app.installation.port;
        }
        server.listen(app.config.listen_port, function() {
            var isUnixSocket = parseInt(app.config.listen_port) != app.config.listen_port;
            if (isUnixSocket && typeof app.config.unixSocketMode !== 'undefined') {
                fs.chmodSync(app.config.listen_port, app.config.unixSocketMode);
            }
            if (app.config.log_format) {
                console.log('TimeIt is running on '+app.installation.href);
            }
        });
    });
}

function configureApplication(config, done) {
    app.config = config;
    if (app.config.install_url.slice(-1) != '/') {
        app.config.install_url += '/';
    }
    app.installation = url.parse(app.config.install_url);
    app.url = function(path) {
        if (path[0] == '/') {
            path = path.slice(1);
        }
        return app.installation.pathname + path;
    };

    app.set('basepath', app.installation.pathname);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

    if (app.config.log_format) {
        app.use(express.logger(app.config.log_format));
    }

    async.parallel([
        function(callback) {
            utils.getGitVersion(function(err, version) {
                if (!err) {
                    app.version = version;
                }
                return callback(err);
            });
        },
        function(callback) {
            db.init(app.config.db, function (err) {
                if (err) {
                    return callback(err);
                }

                cache.init(app.config.cache, function(err) {
                    return callback(err);
                });
            });
        }
    ], noErr(function() {
        installApplication();
        done();
    }));
};

function installApplication() {
    var c = require('./controllers');
    var auth = require('./auth');

    auth.install();

    app.contentCache = ContentCache(app.version);
    app.assetStore = AssetStore(__dirname + '/static', app.contentCache, {
        compile: !app.config.debug
    });
    app.renderer = template.Renderer(__dirname + '/templates');
    app.renderer.contextExtensions.push(context_extensions.AssetCompiler(app.assetStore));

    app.assetStore.register('app.css', [
        'css/bootstrap.css',
        'css/datepicker.css',
        'css/timeit.css',
    ]);

    app.assetStore.register('app.js', [
        'js/lib/jquery.js',
        'js/lib/jquery.favicon.js',
        'js/lib/jquery.disableselection.js',
        'js/lib/underscore.js',
        'js/lib/underscore.exttemplate.js',
        'js/lib/backbone.js',
        'js/lib/backbone.mixin.js',
        'js/lib/backbone.template.js',
        'js/lib/backbone.bootstrap.js',
        'js/lib/bootstrap-modal.js',
        'js/lib/bootstrap-tooltip.js',
        'js/lib/bootstrap-popover.js',
        'js/lib/bootstrap-alert.js',
        'js/lib/bootstrap-datepicker.js',
        'js/lib/raphael.js',
        'js/lib/moment.js',
        'js/jquery.time-slider.js',
        'js/timeit.js',
        'js/timeit.utils.js',
        assets.TemplateLoader({
                templateDir: 'templates',
                objectName: 'timeit.loadTemplate'
        }),
        'js/views/Login.js',
        'js/views/Username.js',
        'js/views/Tracker.js',
        'js/views/SetActivityForm.js',
        'js/views/EditActivityForm.js',
        'js/views/Intersection.js',
        'js/views/Today.js',
        'js/views/AuthLinks.js',
        'js/views/Account.js',
        'js/views/Question.js',
        'js/views/Alert.js',
        'js/ui.js'
    ]);

    function redirectRoot(req, res, next) {
        if (url.parse(req.url).pathname == '/' && req.originalUrl.slice(-1) != '/') {
            res.redirect('', 301);
        } else {
            next();
        }
    }

    function myResponse(req, res, next) {
        res.okJson = function(body) {
            res.json({status: 'ok', body: body});
        };
        res.errJson = function(body) {
            res.json({status: 'err', body: body});
        }
        next();
    }

    app.use(redirectRoot);
    app.use(express.static(__dirname + '/static', {maxAge: app.config.staticFilesMaxAge*1000}));
    app.use(myResponse);
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: app.config.secret,
        store: new MongoStore({db: db.mongo}),
    }));
    app.use(auth.middleware());
    app.use(express.csrf());
    app.use(app.router);
    app.use(express.errorHandler({
        dumpExceptions: !!app.config.log_format,
        showStack: !!app.config.debug
    }));

    app.get ('/', c.index);
    app.get ('/app.js', c.asset);
    app.get ('/app.css', c.asset);

    app.get ('/today', c.activity.today);
    app.get ('/activity', c.activity.get);
    app.post('/activity', c.activity.edit);
    app.post('/current', c.activity.setCurrent);
    app.post('/current/stop', c.activity.stop);

    app.get ('/settings', c.aux.getSettings);
    app.post('/settings', c.aux.setSettings);
    app.get ('/csrf-token', c.aux.getCsrfToken);
    app.get ('/version', c.aux.getVersion);
    app.get ('/messages', c.aux.getMessages);

    app.get ('/auth/providers', c.auth.providers);
    app.get ('/auth/status', c.auth.status);
    app.get ('/auth/links', c.auth.links);
    app.post('/auth/unlink', c.auth.unlink);
    app.post('/auth/confirm', c.auth.confirmAccount);
}
