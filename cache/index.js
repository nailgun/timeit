exports.init = function(config, callback) {
    var backend = config.backend;
    var driver = require('./'+backend)(config);
    driver.init(function(err) {
        if (!err) {
            exports.set = driver.set;
            exports.get = driver.get;
        }
        callback(err);
    });
};
