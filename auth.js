var everyauth = require('everyauth'),
    BSON = require('mongodb').BSONPure,
    app = require('./app'),
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
            return getLinkedAccountPromise(this.Promise(), session, 'google', metadata.id, metadata);
        })
        .redirectPath('/');
    app.config.auth.twitter && everyauth.twitter
        .consumerKey(app.config.auth.twitter.consumerKey)
        .consumerSecret(app.config.auth.twitter.consumerSecret)
        .handleAuthCallbackError(handleCallbackError)
        .myHostname(hostname)
        .findOrCreateUser(function (session, accessToken, accessTokenExtra, metadata) {
            return getLinkedAccountPromise(this.Promise(), session, 'twitter', metadata.id, metadata);
        })
        .redirectPath('/');

    everyauth.everymodule.findUserById(findAccountById);
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

function getLinkedAccountPromise (promise, session, provider, remoteUid, metadata) {
    getLinkedAccount(session, provider, remoteUid, metadata, function (err, account) {
        if (err) {
            promise.fail(err);
        } else {
            promise.fulfill(account);
        }
    });
    return promise;
}

function getLinkedAccount (session, provider, remoteUid, metadata, callback) {
    if (session.req.user) {
        if (provider in session.req.user.links) {
            return callback(new UserError('account already linked with '+provider));
        }
        return linkAccount(session.req.user._id, provider, remoteUid, callback);
    } else {
        findLinkedAccount(provider, remoteUid, function (err, account) {
            if (err) {
                return callback(err);
            }

            if (account) {
                return callback(null, account);
            } else {
                return createLinkedAccount (provider, remoteUid, metadata, callback);
            }
        });
    }
}

function linkAccount (accountId, provider, remoteUid, callback) {
    app.db.collection('accounts', function(err, accounts) {
        if (err) {
            return callback(err);
        }

        var dataset = {};
        dataset['links.'+provider] = remoteUid;

        accounts.count(dataset, function (err, count) {
            if (err) {
                return callback(err);
            }

            if (count) {
                return callback(new UserError('already exists account linked with '+provider));
            }

            accounts.findAndModify({
                _id: accountId
            }, [], {
                $set: dataset
            }, {
                safe: true,
                new: true
            }, function (err, account) {
                if (account) {
                    account.id = account._id;
                }
                callback(err, account);
            });
        });
    });
}

function findLinkedAccount (provider, remoteUid, callback) {
    app.db.collection('accounts', function(err, accounts) {
        if (err) {
            return callback(err);
        }

        var query = {};
        query['links.'+provider] = remoteUid;
        accounts.findOne(query, function (err, account) {
            if (account) {
                account.id = account._id;
            }
            callback(err, account);
        });
    });
}

function createLinkedAccount (provider, remoteUid, metadata, callback) {
    app.db.collection('accounts', function(err, accounts) {
        if (err) {
            return callback(err);
        }

        var account = {
            registrationDate: new Date(),
            confirmed: false,
            links: {},
            settings: {},
        }
        account.links[provider] = remoteUid;
        if (metadata.name) {
            account.settings.username = metadata.name;
        }

        accounts.insert(account, function(err, docs) {
            if (err) {
                return callback(err);
            }
            var account = docs[0];
            account.id = account._id;
            return callback(null, account);
        });
    });
}

function findAccountById (id, callback) {
    app.db.collection('accounts', function (err, accounts) {
        if (err) {
            return callback(err);
        }

        accounts.findOne({
            _id: new BSON.ObjectID(id)
        }, function (err, account) {
            if (account) {
                account.id = account._id;
            }
            callback(err, account);
        });
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
