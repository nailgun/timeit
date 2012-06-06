var openid = require('openid');
var BSON = require('mongodb').BSONPure;
var app = require('../app');
var noErr = require('../utils').noErr;

var relyingParty = new openid.RelyingParty(app.installation.href+'auth/callback');

exports.login = function(req, res) {
    var identifier = req.query['openid'];

    relyingParty.authenticate(identifier, false, function(err, auth_url) {
        if (err) {
            res.end('Authentication failed: ' + err.message);
        } else if (!auth_url) {
            res.end('Authentication failed');
        } else {
            res.redirect(auth_url);
        }
    });
};

function openIdSuccess(req, res, userId) {
    req.session.userId = userId;
    res.redirect('');
}

exports.openIdCallback = function (req, res) {
    openid.verifyAssertion(req, function(err, result) {
        if (!err && result.authenticated) {
            var openid = result.claimedIdentifier;
            app.db.collection('accounts', noErr(function(accounts) {
                accounts.findOne({openid: openid}, noErr(function(doc) {
                    if (doc) {
                        openIdSuccess(req, res, doc._id);
                    } else {
                        accounts.insert({openid: openid}, noErr(function(docs) {
                            openIdSuccess(req, res, docs[0]._id);
                        }));
                    }
                }));
            }));
        } else {
            res.redirect('login-failed.html');
        }
    });
};

exports.status = function (req, res) {
    res.json({logged_in: !!req.user});
};

exports.logout = function (req, res) {
    delete req.session.userId;
    res.redirect('');
};

exports.middleware = function (req, res, next) {
    if (!req.session.userId) {
        req.user = null;
        next();
        return;
    }

    app.db.collection('accounts', noErr(function(accounts) {
        var ob_id = null;
        try {
            ob_id = new BSON.ObjectID(req.session.userId);
        } catch(err) {
            req.user = null;
            next();
            return;
        }

        accounts.findOne({_id: ob_id}, noErr(function(doc) {
            req.user = doc;
            next();
        }));
    }));
};
