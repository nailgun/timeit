var app = require('../app');

module.exports = function(config) {
    var driver = {
        config: config
    };

    driver.init = function(callback) {
        app.db.clllection(config.collection || 'cache', function (err, collection) {
            if (!err) {
                driver.collection = collection;
            }
            collback(err);
        });
    };

    driver.set = function(key, value, callback) {
        driver.collection.update({
            _id: key
        }, {
            $set: {v: value}
        }, {
            safe: true,
            upsert: true
        }, callback);
    };

    driver.get = function(key, callback) {
        driver.collection.findOne({
            _id: key
        }, [
            'v'
        ], function (err, doc) {
            if (err) {
                callback(err);
            } else {
                callback(err, doc.v);
            }
        });
    };

    return driver;
};
