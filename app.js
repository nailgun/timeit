var connect = require('connect');
var mongo = require('mongodb');
var openid = require('openid');
var config = require('./config');
var BSON = mongo.BSONPure;

var db = mongo.Db(
        config.mongo_db,
        new mongo.Server(config.mongo_host, config.mongo_port, {}),
        {});

function set_activity(req, res) {
    var activity_name = req.query['name'];

    db.collection('activities', function(err, collection) {
        collection.update({end_time: null}, {$set: {end_time: new Date()}}, {safe: true, multi: true}, function(err) {
            collection.insert({
                name: activity_name,
                start_time: new Date(),
                end_time: null
            }, function(docs) {
                res.end(JSON.stringify({result: 'done'}));
            });
        });
    });
}

function stop_activity(req, res) {
    db.collection('activities', function(err, collection) {
        collection.update({end_time: null}, {$set: {end_time: new Date()}}, {safe: true, multi: true}, function(err) {
            res.end(JSON.stringify({result: 'done'}));
        });
    });
}

function current_activity(req, res) {
    db.collection('activities', function(err, activities) {
        activities.find({end_time: null}, ['name', 'start_time']).toArray(function(err, docs) {
            res.end(JSON.stringify(docs));
        });
    });
}

var relying_party = new openid.RelyingParty('http://time.it:3000/openid-callback');

function login(req, res) {
    var identifier = req.query['openid'];

    relying_party.authenticate(identifier, false, function(err, auth_url) {
        if (err) {
            res.end('Authentication failed: ' + err.message);
        } else if (!auth_url) {
            res.end('Authentication failed');
        } else {
            res.writeHead(302, { Location: auth_url });
            res.end();
        }
    });
}

function openid_success(req, res, sid) {
    res.writeHead(302, {
        Location: '/',
        'Set-Cookie': connect.utils.serializeCookie('sid', sid)
    });
    res.end();
}

function openid_callback(req, res) {
    openid.verifyAssertion(req, function(err, result) {
        if (!err && result.authenticated) {
            var openid = result.claimedIdentifier;
            db.collection('accounts', function(err, accounts) {
                accounts.findOne({openid: openid}, function(err, doc) {
                    if (doc) {
                        openid_success(req, res, doc._id);
                    } else {
                        accounts.insert({openid: openid}, function(err, doc) {
                            openid_success(req, res, doc._id);
                        });
                    }
                });
            });
        } else {
            res.writeHead(302, { Location: '/login-failed.html' });
            res.end();
        }
    });
}

function login_status(req, res) {
    res.end(JSON.stringify({logged_in: (req.user ? true : false)}));
}

function get_user(req, res, next) {
    req.sid = req.cookies['sid'];
    if (!req.sid) {
        req.user = null;
        next();
        return;
    }

    db.collection('accounts', function(err, accounts) {
        var ob_id = null;
        try {
            ob_id = new BSON.ObjectID(req.sid);
        } catch(err) {
            req.user = null;
            next();
            return;
        }

        accounts.findOne({_id: ob_id}, function(err, doc) {
            req.user = doc;
            next();
        });
    });
}

function logout(req, res) {
    res.writeHead(302, {
        Location: '/',
        'Set-Cookie': connect.utils.serializeCookie('sid', '')
    });
    res.end();
}

function route(req, res, next) {
    if (req._parsedUrl.pathname == '/set-activity') {
        set_activity(req, res);
    } else if (req._parsedUrl.pathname == '/stop-activity') {
        stop_activity(req, res);
    } else if (req._parsedUrl.pathname == '/current-activity') {
        current_activity(req, res);
    } else if (req._parsedUrl.pathname == '/login') {
        login(req, res);
    } else if (req._parsedUrl.pathname == '/openid-callback') {
        openid_callback(req, res);
    } else if (req._parsedUrl.pathname == '/login-status') {
        login_status(req, res);
    } else if (req._parsedUrl.pathname == '/logout') {
        logout(req, res);
    }
}

console.log('Connecting to database...');
db.open(function(err, db) {
    console.log('Connected to database.');

    var app = connect()
        .use(connect.logger('dev'))
        .use(connect.static('static'))
        .use(connect.query())
        .use(connect.cookieParser())
        .use(get_user)
        .use(route);

    console.log('Listening...');
    app.listen(config.port);
});
