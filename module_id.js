var _model = require('./model.js');
var defineGetter = _model.defineGetter;
var defineSimpleGetter = _model.defineSimpleGetter;


function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}


function ModuleID(year, shortName, location) {
    if (!isNumeric(year)) {
        throw new Error('year must be a number');
    }

    defineSimpleGetter(this, 'year', year);
    defineSimpleGetter(this, 'shortName', shortName);
    defineSimpleGetter(this, 'location', location);
}

ModuleID.prototype.toString = function () {
    return this.year + '/' + this.shortName + '/' + this.location;
}

ModuleID.prototype.equals = function (other) {
    return this.toString() === other.toString();
}

ModuleID.create = function () {
    var params = Array.prototype.slice.call(arguments);

    if (params.length == 1) {
        var arg = params[0];

        if (Array.isArray(arg))
            return ModuleID.fromArray(arg);
        else if (arg instanceof ModuleID)
            return arg;
        else
            throw new Error("Can't convert the given argument " +
                            'to a ModuleID');
    }

    if (params.length != 3)
        throw new Error('The argument count must be 3');

    return new ModuleID(params[0], params[1], params[2]);
}

/**
 * array must be an array of three items: [year, shortName, location]
 */
ModuleID.fromArray = function (array) {
    if (array.length != 3) {
        throw new Error('The array length must be 3');
    }
    return new ModuleID.apply(null, array);
}

ModuleID.fromString = function (path) {
    var array = path.split('/');
    if (array.length != 3) {
        throw new Error('Invalid path: ' + array);
    }

    var year = parseInt(array[0]);
    if (isNaN(year)) {
        throw new Error('Invalid year: ' + array[0]);
    }
    return new ModuleID(year, array[1], array[2]);
}

ModuleID.fromPath = function (path) {
    var array = path.split('/');
    if (array.length != 6) {
        throw new Error('Invalid path: ' + path);
    }

    array.shift();
    array.shift();
    var year = parseInt(array[0]);
    if (isNaN(year)) {
        throw new Error('Invalid year: ' + array[0]);
    }
    return new ModuleID(year, array[1], array[2]);
}

module.exports = {
    ModuleID: ModuleID,
};
