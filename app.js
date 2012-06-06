var express = require('express')
  , mongo = require('mongodb')
  , url = require('url')
  , MongoStore = require('connect-mongodb');
require('express-configure');

var app = module.exports = express.createServer();
var server = express.createServer();

app.configure(function(done) {
    app.config = require('./config.json');
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
        server.use(express.logger(app.config.log_format));
        console.log('Connecting to database...');
    }
    app.db.open(function(err, db) {
        if (app.config.log_format) {
            console.log('Connected to database.');
        }

        installApplication();
        done();
    });
});

app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
    app.use(express.errorHandler());
});

if (!app.config.listen_port) {
    app.config.listen_port = app.installation.port;
}
server.listen(app.config.listen_port, function() {
    if (app.config.log_format) {
        console.log('TimeIt is running on '+app.installation.href);
    }
});

function installApplication() {
    var c = require('./controllers');

    function redirectRoot(req, res, next) {
        if (url.parse(req.url).pathname == '/' && req.originalUrl.slice(-1) != '/') {
            res.redirect('', 301);
        } else {
            next();
        }
    }

    app.use(redirectRoot);
    app.use(express.static(__dirname + '/static'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: app.config.secret,
        store: new MongoStore({db: app.db}),
    }));
    app.use(express.csrf());
    app.use(c.auth.middleware);
    app.use(app.router);

    app.get ('/activity', c.activity.getCurrent);
    app.get ('/today', c.activity.today);
    app.post('/activity', c.activity.setCurrent);
    app.post('/activity/add-earlier', c.activity.addEarlier);
    app.post('/activity/stop', c.activity.stop);

    app.get ('/settings', c.aux.getSettings);
    app.post('/settings', c.aux.setSettings);
    app.get ('/csrf-token', c.aux.getCsrfToken);

    app.get ('/auth/login', c.auth.login);
    app.get ('/auth/logout', c.auth.logout);
    app.get ('/auth/callback', c.auth.openIdCallback);
    app.get ('/auth/status', c.auth.status);

    server.use(app.installation.pathname, app);
}
