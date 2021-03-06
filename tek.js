
var Moment = require('moment');
var Session = require('./session.js').Session;
var EpitechRequest = require('./epitech_request.js').EpitechRequest;
var timeUtils = require('./time_utils.js');


function parseDate(string) {
    var m = Moment(string, 'YYYY-MM-DD');
    if (!m.isValid())
        throw new Error('Invalid date');
    return m;
}

function parseTimeDuration(string) {
    var m = Moment.duration(string, 'HH:mm:ss');
    return m;
}

function parseDateTime(string) {
    var m = Moment(string, 'YYYY-MM-DD HH:mm:ss');
    if (!m.isValid())
        throw new Error('Invalid date');
    return m;
}



function Student(json) {
    this.login = json.login;
    this.email = json.internal_email;
    this.firstName = json.firstname;
    this.lastName = json.lastname;
    this.picture = json.picture;
    this.location = {
        city: json.location,
    }
    this.promotion = json.promo;
    this.closed = json.close;
    this.own = false;
};

Student.get = function (session, login, callback) {
    session.request('user/' + login, function (error, text) {

        if (error) {
            return callback(error, null);
        }

        var json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            return callback(e, null);
        }

        var student = new Student(json);
        callback(null, student);
    });
}



function OwnStudent(json) {
    Student.call(this, json);
    this.own = true;
    this.closeReason = json.close_reason;
    this.modules = [];
}

OwnStudent.get = function (session, callback) {
    session.request('user/' + session.login, function (error, text) {

        if (error) {
            return callback(error, null);
        }

        var json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            return callback(e, null);
        }

        var student = new OwnStudent(json);
        callback(null, student);
    });
}




function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function ModuleID(year, shortName, location) {
    if (!isNumeric(year)) {
        throw new Error('year must be a number');
    }
    this.year = year;
    this.shortName = shortName;
    this.location = location;
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
        else
            return arg;
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
    return new ModuleID(array[0], array[1], array[2]);
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



function Event(activity, json) {
    this.activity = activity;
    this.begin = parseDateTime(json.begin);
    this.end = parseDateTime(json.end);
}

Event.prototype.getDuration = function () {
    return Moment.duration(this.end.diff(this.begin));
}

Event.prototype.contains = function (moment) {
    return timeUtils.isBetweenInc(moment, this.begin, this.end);
}



function Activity(module, json) {
    this.shortName = json.codeacti;
    this.name = json.title;
    this.typeName = json.type_title;
    this.module = module;

    this.begin = parseDateTime(json.begin);
    this.end = parseDateTime(json.end);

    this.time = parseTimeDuration(json.nb_hour);

    this.events = [];
    for (var i = 0; i < json.events.length; i++) {
        var event = new Event(this, json.events[i]);
        this.events.push(event);
    }
}

Activity.prototype.toString = function () {
    var s = ('shortName: ' + this.shortName + '\n' +
             'name: ' + this.name + '\n' +
             'typeName: ' + this.typeName + '\n' +
             'moduleName: ' + this.module.name + '\n' +
             'moduleID: ' + this.module.getID() + '\n' +
             'begin: ' + this.begin.calendar() + '\n' +
             'end: ' + this.end.calendar() + '\n')
    return s;
}

Activity.prototype.contains = function (moment) {
    return timeUtils.isBetweenInc(moment, this.begin, this.end);
}



function Module(json) {
    this.id = new ModuleID(json.scolaryear,
                           json.codemodule,
                           json.codeinstance);

    this.name = json.title;
    this.description = json.description;
    this.skills = json.competence;

    this.credits = json.credits;
    this.studentCredits = json.user_credits;
    this.studentRegistered = json.student_registered === 1;

    this.begin = json.begin === null ? null : parseDate(json.begin);
    this.end = json.begin === null ? null : parseDate(json.end);

    this.activities = [];
    for (var i = 0; i < json.activites.length; i++) {
        var activity = new Activity(this, json.activites[i]);
        this.activities.push(activity);
    }
}

Module.prototype.getActivity = function (shortName) {
    for (var i = 0; i < this.activities.length; i++) {
        var activity = this.activities[i];
        if (activity.shortName === shortName)
            return activity;
    }
    return null;
}

Module.prototype.toString = function () {
    var begin = this.begin === null ? null : this.begin.calendar();
    var end = this.end === null ? null : this.end.calendar();

    var s = ('id: ' + this.getID() + '\n' +
             'name: ' + this.name + '\n' +
             (begin ? 'begin: ' + this.begin.calendar() + '\n' : '') +
             (end ? 'end: ' + this.end.calendar() + '\n' : '') +
             'credits: ' + this.credits + '\n' +
             'studentCredits: ' + this.studentCredits + '\n' +
             'studentRegistered: ' + this.studentRegistered + '\n');

    s += 'activities:\n'
    for (var i = 0; i < this.activities.length; i++) {
        var activity = this.activities[i];
        s += '    ' + activity.shortName + ' ' + activity.name + '\n';
    }
    return s;
}

Module.prototype.contains = function (moment) {
    return timeUtils.isBetweenInc(moment, this.begin, this.end);
}

Module.prototype.getID = function () {
    return this.id;
}

Module.prototype.getEvents = function () {
    var events = [];
    for (var i = 0; i < this.activities.length; i++) {
        var activity = this.activities[i];
        events = events.concat(activity.events);
    }
    return events;
}

Module.get = function (session, moduleID, callback) {
    moduleID = ModuleID.create(moduleID);

    var path = 'module/' + moduleID
    session.request(path, function (error, text) {
        if (error)
            return callback(error, null);

        var json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            return callback(e, null);
        }

        var module = new Module(json);
        callback(null, module);
    });
}

Module.getEpitechRequest = function (session, moduleID) {
    var epitechRequest = new EpitechRequest(session);

    Module.get(session, moduleID, function (error, module) {
        if (error)
            epitechRequest.fireEvent('error', error);
        else {
            epitechRequest.fireEnd(module);
        }
    });

    return epitechRequest;
}

Module.getIDs = function (session, callback) {
    session.request('course/filter', function (error, text) {

        if (error)
            return callback(error, null);

        var json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            return callback(e, null);
        }

        if (!Array.isArray(json))
            throw Error();

        var ids = [];
        for (var i = 0; i < json.length; i++) {
            var id = new ModuleID(json[i].scolaryear,
                                  json[i].code,
                                  json[i].codeinstance);
            ids.push(id);
        }
        callback(null, ids);
    });
}



function Epitech(ownStudent, modules, json) {
    this.ownStudent = ownStudent;
    this.modules = modules;
}

Epitech.prototype.getModule = function (id) {
    for (var i = 0; i < this.modules.length; i++) {
        var module = this.modules[i];
        if (module.id.equals(id))
            return module;
    }
    return null;
}

Epitech.prototype.getActivity = function (shortName) {
    for (var i = 0; i < this.modules.length; i++) {
        var module = this.modules[i];
        var activity = module.getActivity(shortName);
        if (activity)
            return activity;
    }
    return null;
}

Epitech.prototype.getActivities = function () {
    var activities = [];
    for (var i = 0; i < this.modules.length; i++) {
        var module = this.modules[i];
        activities = activities.concat(module.activities);
    }
    return activities;
}

Epitech.prototype.getEvents = function () {
    var events = [];
    for (var i = 0; i < this.modules.length; i++) {
        var module = this.modules[i];
        events = events.concat(module.getEvents());
    }
    return events;
}

Epitech.getModules = function (parentRequest, modulesIDs) {
    for (var i = 0; i < modulesIDs.length; i++) {
        var id = modulesIDs[i];
        var request = Module.getEpitechRequest(parentRequest.session, id);
        parentRequest.addChildRequest(request);
    }
}

Epitech.getJSON = function (session, callback) {
    session.request('', function (error, text) {

        if (error) {
            return callback(error, null);
        }

        var json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            return callback(e, null);
        }

        callback(null, json);
    });
}

Epitech.getEpitechRequest = function (session) {
    var epitechRequest = new EpitechRequest(session);
    var modulesIDs = null;
    var json = null;
    var ownStudent = null;

    OwnStudent.get(session, function (error, ownStudentArg) {
        if (error)
            return epitechRequest.fireEvent('error', error);

        ownStudent = ownStudentArg;
        epitechRequest.fireEvent('update');
    });


    Module.getIDs(session, function (error, idsArg) {
        if (error)
            return epitechRequest.fireEvent('error', error);

        modulesIDs = idsArg;
        Epitech.getModules(epitechRequest, modulesIDs);
    });

    Epitech.getJSON(session, function (error, jsonArg) {
        if (error)
            return epitechRequest.fireEvent('error', error);
        json = jsonArg;
    });

    epitechRequest.on('update', function () {
        if (json === null || ownStudent === null || modulesIDs === null)
            return;

        if (epitechRequest.areChildrenFinished()) {
            var modules = epitechRequest.getChildResults();
            var epitech = new Epitech(ownStudent, modules, json)
            epitechRequest.fireEnd(epitech);
        }
    });

    return epitechRequest;
}



module.exports = {
    timeUtils: timeUtils,

    Epitech: Epitech,
    EpitechRequest: EpitechRequest,
    Event: Event,
    Module: Module,
    ModuleID: ModuleID,
    OwnStudent: OwnStudent,
    Session: Session,
    Student: Student,
};
