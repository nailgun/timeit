var express = require('express'),
    mongo = require('mongodb'),
    async = require('async'),
    url = require('url'),
    path = require('path'),
    MongoStore = require('connect-mongodb'),
    utils = require('./utils'),
    noErr = utils.noErr,
    fs = require('fs');

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

    var mongo_port = app.config.mongo_port || mongo.Connection.DEFAULT_PORT;
    app.db = mongo.Db(app.config.mongo_db,
                      new mongo.Server(app.config.mongo_host, mongo_port, {}),
                      {});

    if (app.config.log_format) {
        app.use(express.logger(app.config.log_format));
        console.log('Connecting to database...');
    }

    async.parallel([
        function(callback) {
            utils.getGitVersion(function(err, version) {
                app.version = version;
                callback(err);
            });
        },
        function(callback) {
            app.db.open(function(err, db) {
                if (app.config.log_format) {
                    console.log('Connected to database.');
                }

                installApplication();
                callback(err);
            });
        }
    ], noErr(done));
};

function installApplication() {
    var c = require('./controllers');

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
    app.use(myResponse);
    app.use(express.static(__dirname + '/static', {maxAge: app.config.staticFilesMaxAge*1000}));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: app.config.secret,
        store: new MongoStore({db: app.db}),
    }));
    app.use(express.csrf());
    app.use(c.auth.middleware);
    app.use(app.router);
    app.use(express.errorHandler({
        dumpExceptions: !!app.config.log_format,
        showStack: !!app.config.debug
    }));

    app.get ('/activity', c.activity.getCurrent);
    app.get ('/today', c.activity.today);
    app.post('/activity', c.activity.setCurrent);
    app.post('/activity/add-earlier', c.activity.addEarlier);
    app.post('/activity/stop', c.activity.stop);

    app.get ('/settings', c.aux.getSettings);
    app.post('/settings', c.aux.setSettings);
    app.get ('/csrf-token', c.aux.getCsrfToken);
    app.get ('/version', c.aux.getVersion);

    app.get ('/auth/login', c.auth.login);
    app.get ('/auth/logout', c.auth.logout);
    app.get ('/auth/callback', c.auth.openIdCallback);
    app.get ('/auth/status', c.auth.status);
}
