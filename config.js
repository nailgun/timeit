var config = {};

config.port = 3000;
config.mongo_db = 'timeit';
config.mongo_host = 'localhost';
config.mongo_port = require('mongodb').Connection.DEFAULT_PORT;

/*
config.oauth_providers = {
    vk: {
        auth_url: 'http://oauth.vk.com/authorize',
        token_url: 'https://oauth.vk.com/access_token',
        client_id: 
    }
};
*/

module.exports = config;
