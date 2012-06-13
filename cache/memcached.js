var app = require('../app'),
    mc = require('mc');

module.exports = function(config) {
    var driver = {
        config: config
    };

    driver.init = function(callback) {
        if (app.config.log_format) {
            console.log('Connecting to memcached...');
        }

        driver.client = new mc.Client(config.hosts);
        driver.client.connect((function (err) {
            if (!err && app.config.log_format) {
                console.log('Connected to memcached.');
            }
            return callback(err);
        }));
    };

    driver.set = function(key, value, callback) {
        driver.client.set('timeit.'+key, value, callback);
    };

    driver.get = function(key, callback) {
        driver.client.get('timeit.'+key, function(err, value) {
            if (!err) {
                value = value['timeit.'+key];
            }
            return callback(err, value);
        });
    };

    return driver;
};
