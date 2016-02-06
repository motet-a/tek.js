var https = require('https');
var querystring = require('querystring');


function Session(login, password) {
    this.login = login;
    this.password = password;
}

Session.prototype.getURLEncodedContent = function () {
    return querystring.stringify({
        login: this.login,
        password: this.password,
        remind: 'true',
    });
}

Session.prototype.getRequestOptions = function (path) {
    return {
        hostname: 'intra.epitech.eu',
        path: '/' + path + '/?format=json',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    };
}

Session.prototype.request = function (path, callback) {
    var options = this.getRequestOptions(path);
    var result = '';

    var req = https.request(options);

    req.on('response', function (message) {
        if (message.statusCode !== 200) {
            req.abort();
            return callback(message, null);
        }

        message.setEncoding('utf8');
        message.on('data', function (chunk) {
            result += chunk;
        });
        message.on('end', function () {
            callback(null, result);
        });
    });

    req.on('error', function (error) {
        callback(error, null);
    });

    req.write(this.getURLEncodedContent());

    req.end();
}

module.exports.Session = Session;
