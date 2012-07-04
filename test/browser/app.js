var express = require('express'),
    path = require('path');

var app = module.exports = express.createServer();

app.use(express.logger('dev'));
app.use(express.static(path.join(__dirname, '../../frontend/js')));
app.use('/test', express.static(__dirname));

if (require.main === module) {
    main();
}

function main() {
    app.listen(3333, function() {
        console.log('Go to http://localhost:3333/test');
    });
}
