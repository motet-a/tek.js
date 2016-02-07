var https = require('https');
var querystring = require('querystring');

var _model = require('./model.js');
var defineGetter = _model.defineGetter;
var defineSimpleGetter = _model.defineSimpleGetter;


function NetworkError(message) {

}


function Session(login, password) {
    defineSimpleGetter(this, 'login', login);
    defineSimpleGetter(this, 'password', password);
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

Session.prototype.requestJSON = function (path, callback) {
    this.request(path, function (error, text) {
        if (error)
            return callback(error, null);

        var object;
        try {
            object = JSON.parse(text)
        } catch (e) {
            return callback(e, null);
        }

        callback(null, object);
    });
}

module.exports.Session = Session;
