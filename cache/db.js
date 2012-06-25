var db = require('../db');

module.exports = function(config) {
    var driver = {
        config: config
    };

    driver.init = function(callback) {
        db.mongo.collection(config.collection || 'cache', function (err, collection) {
            if (!err) {
                driver.collection = collection;
            }
            return callback(err);
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
                return callback(err);
            } else if (!doc) {
                return callback(new Error('key not found'));
            } else {
                return callback(err, doc.v);
            }
        });
    };

    return driver;
};
