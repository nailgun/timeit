var db = require('./db'),
    utils = require('./utils'),
    noErr = utils.noErr,
    async = require('async'),
    path = require('path'),
    _ = require('underscore');

if (require.main === module) {
    main();
}

function main() {
    var configPath = process.argv[2];
    if (!configPath) {
        console.error('USAGE: migrate_db.js CONFIG.JSON');
        process.exit(1);
    }

    configPath = path.resolve(process.cwd(), configPath);
    var config = require(configPath);

    db.init(config.db, noErr(function () {
        var collections = {
            accounts: null,
            activities: null
        };

        async.forEach(_.keys(collections), function (cName, callback) {
            db.mongo.collection(cName, function (err, collection) {
                if (!err) {
                    collections[cName] = collection;
                }
                callback(err);
            });
        }, noErr(function () {
            migrate(collections, function () {
                console.log('done');
                process.exit(0);
            });
        }));
    }));
}

function migrate (c, done) {
    async.waterfall([function (callback) {
        c.accounts.find().toArray(noErr(function (docs) {
            c.accounts.remove(noErr(function () {
                convertAccounts(docs, callback);
            }));
        }));
    }, function (account2user, callback) {
        c.activities.find().toArray(noErr(function (docs) {
            c.activities.remove(noErr(function () {
                convertActivities(docs, account2user, callback);
            }));
        }));
    }], noErr(function () {
        done();
    }));
}

function convertAccounts (accounts, callback) {
    var account2user = {};

    async.forEach(accounts, function (account, callback) {
        var user = new db.User();
        user.confirmed = true;
        user.registrationDate = new Date();
        user.messages = [];
        user.settings = account.settings;
        user.links = {
            google: '115278772259467172872'
        };
        user.save(function (err) {
            if (!err) {
                account2user[account._id] = user._id;
            }
            callback(err);
        });

    }, function (err) {
        callback(err, account2user);
    });
}

function convertActivities (activities, account2user, callback) {
    callback = callback || function () {};

    async.forEach(activities, function (activity, callback) {
        var newActivity = new db.Activity();
        newActivity.userId = account2user[activity.account];
        newActivity.start_time = activity.start_time;
        newActivity.end_time = activity.end_time;
        newActivity.name = activity.name;
        newActivity.tags = activity.tags;
        newActivity.save(callback);

    }, noErr(callback));
}
