var everyauth = require('everyauth'),
    app = require('./app'),
    db = require('./db'),
    util = require('util');

function UserError(msg) {
    this.name = 'UserError';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}
UserError.prototype.__proto__ = Error.prototype;

exports.install = function() {
    var hostname = app.config.install_url.slice(0, -1);

    app.config.auth.google && everyauth.google
        .appId(app.config.auth.google.clientId)
        .appSecret(app.config.auth.google.clientSecret)
        .scope('https://www.googleapis.com/auth/userinfo.profile')
        .handleAuthCallbackError(handleCallbackError)
        .myHostname(hostname)
        .findOrCreateUser(function (session, accessToken, accessTokenExtra, metadata) {
            return getLinkedUserPromise(this.Promise(), session, 'google', metadata.id, metadata);
        })
        .redirectPath('/');
    app.config.auth.twitter && everyauth.twitter
        .consumerKey(app.config.auth.twitter.consumerKey)
        .consumerSecret(app.config.auth.twitter.consumerSecret)
        .handleAuthCallbackError(handleCallbackError)
        .myHostname(hostname)
        .findOrCreateUser(function (session, accessToken, accessTokenExtra, metadata) {
            return getLinkedUserPromise(this.Promise(), session, 'twitter', metadata.id, metadata);
        })
        .redirectPath('/');

    everyauth.everymodule.findUserById(findUserById);
    everyauth.everymodule.logoutPath('/auth/logout');
    everyauth.everymodule.performRedirect(function (res, location) {
        if (location === '/') {
            location = '';
        }
        res.redirect(location, 303);
    });
};

exports.middleware = everyauth.middleware;

exports.providers = function() {
    var providers = [];
    for (provider in everyauth.enabled) {
        providers.push(provider);
    }
    return providers;
};

function getLinkedUserPromise (promise, session, provider, remoteUid, metadata) {
    getLinkedUser(session, provider, remoteUid, metadata, function (err, account) {
        if (err) {
            promise.fail(err);
        } else {
            promise.fulfill(account);
        }
    });
    return promise;
}

function getLinkedUser (session, provider, remoteUid, metadata, callback) {
    if (session.req.user) {
        if (provider in session.req.user.links) {
            return callback(new UserError('account already linked with '+provider));
        }
        return linkUser(session.req.user, provider, remoteUid, callback);
    } else {
        findLinkedUser(provider, remoteUid, function (err, account) {
            if (err) {
                return callback(err);
            }

            if (account) {
                return callback(null, account);
            } else {
                return createLinkedUser (provider, remoteUid, metadata, callback);
            }
        });
    }
}

function linkUser (user, provider, remoteUid, callback) {
    var dataset = {};
    dataset['links.'+provider] = remoteUid;

    db.User.count(dataset, function (err, count) {
        if (err) {
            return callback(err);
        }

        if (count) {
            return callback(new UserError('already exists account linked with '+provider));
        }

        db.User.update({
            _id: user._id
        }, {
            $set: dataset
        }, function (err) {
            if (!err) {
                user.links[provider] = remoteUid;
            }
            callback(err, user);
        });
    });
}

function findLinkedUser (provider, remoteUid, callback) {
    var query = {};
    query['links.'+provider] = remoteUid;
    db.User.findOne(query, function (err, account) {
        if (account) {
            account.id = account._id;
        }
        callback(err, account);
    });
}

function createLinkedUser (provider, remoteUid, metadata, callback) {
    var user = new db.User();
    user.links = {};
    user.links[provider] = remoteUid;
    if (metadata.name) {
        user.settings.username = metadata.name;
    }
    user.save(function (err) {
        if (err) {
            return callback(err);
        }
        user.id = user._id;
        return callback(null, user);
    });
}

function findUserById (id, callback) {
    db.User.findOne({
        _id: id
    }, function (err, user) {
        if (user) {
            user.id = user._id;
        }
        callback(err, user);
    });
}

function handleCallbackError (req, res) {
    var messages = req.session.messages = req.session.messages || [];
    messages.push({
        title: 'Authentication error',
        body: 'Access denied by provider',
        severity: 'error'
    });
    this.redirect(res, '/');
}
