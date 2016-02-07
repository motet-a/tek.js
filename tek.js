
var Moment = require('moment');
var timeUtils = require('./time_utils.js');

var _model = require('./model.js');
var Model = _model.Model;
var defineGetter = _model.defineGetter;
var defineSimpleGetter = _model.defineSimpleGetter;

var Session = require('./session.js').Session;
var ModuleID = require('./module_id.js').ModuleID;
var ActivityID = require('./activity_id.js').ActivityID;



function Student(epitech, json) {
    Model.call(this, epitech);

    defineSimpleGetter(this, 'login', json.login);
    defineSimpleGetter(this, 'email', json.internal_email);

    defineSimpleGetter(this, 'firstName', json.firstname);
    defineSimpleGetter(this, 'lastName', json.lastname);

    defineSimpleGetter(this, 'picture', json.picture);
    defineSimpleGetter(this, 'location', {
        city: json.location,
    });
    defineSimpleGetter(this, 'promotion', json.promotion);
    defineSimpleGetter(this, 'closed', json.close);
    defineSimpleGetter(this, 'own', false);
};

Student.get = function (epitech, login, callback) {
    var session = epitech.session;
    session.requestJSON('user/' + login, function (error, json) {
        if (error)
            return callback(error, null);

        var student = new Student(epitech, json);
        callback(null, student);
    });
}



function OwnStudent(epitech, json) {
    Student.call(this, epitech, json);

    defineSimpleGetter(this, 'own', true);
    defineSimpleGetter(this, 'closeReason', json.close_reason);

    var modulesIDs = [];
    defineGetter(this, 'modulesIDs', function () {
        return modulesIDs;
    });
}

OwnStudent.get = function (epitech, callback) {
    var session = epitech.session;
    session.requestJSON('user/' + session.login, function (error, json) {
        if (error)
            return callback(error, null);

        var student = new OwnStudent(epitech, json);
        callback(null, student);
    });
}






function Event(epitech, activityID, json) {
    Model.call(this, epitech);

    defineSimpleGetter(this, 'activityID', activityID);

    var begin = timeUtils.parseDateTime(json.begin);
    var end = timeUtils.parseDateTime(json.end);
    defineSimpleGetter(this, 'begin', begin);
    defineSimpleGetter(this, 'end', end);

    defineGetter(this, 'duration', function () {
        return Moment.duration(end.diff(begin));
    });
}

Event.prototype.contains = function (moment) {
    return timeUtils.isBetweenInc(moment, this.begin, this.end);
}



function Activity(epitech, moduleID, json) {

    var id = new ActivityID(moduleID, json.codeacti);
    defineSimpleGetter(this, 'id', id);

    defineSimpleGetter(this, 'name', json.title);
    defineSimpleGetter(this, 'typeName', json.type_name);

    var begin = timeUtils.parseDateTime(json.begin);
    var end = timeUtils.parseDateTime(json.end);
    defineSimpleGetter(this, 'begin', begin);
    defineSimpleGetter(this, 'end', end);

    var time = timeUtils.parseTimeDuration(json.nb_hour);
    defineSimpleGetter(this, 'time', time);

    // TODO
    this.events = [];
    for (var i = 0; i < json.events.length; i++) {
        var event = new Event(this, json.events[i]);
        this.events.push(event);
    }
}

Activity.prototype.toString = function () {
    var s = ('id: ' + this.id + '\n' +
             'name: ' + this.name + '\n' +
             'typeName: ' + this.typeName + '\n' +
             'moduleName: ' + this.module.name + '\n' +
             'begin: ' + this.begin.calendar() + '\n' +
             'end: ' + this.end.calendar() + '\n')
    return s;
}

Activity.prototype.contains = function (moment) {
    return timeUtils.isBetweenInc(moment, this.begin, this.end);
}



function Module(epitech, json) {
    var id = new ModuleID(json.scolaryear,
                          json.codemodule,
                          json.codeinstance);
    defineSimpleGetter(this, 'id', id);

    defineSimpleGetter(this, 'name', json.title);
    defineSimpleGetter(this, 'description', json.description);
    defineSimpleGetter(this, 'skills', json.competence);
    defineSimpleGetter(this, 'credits', json.credits);
    defineSimpleGetter(this, 'studentCredits', json.user_credits);
    defineSimpleGetter(this, 'studentRegistered',
                       json.student_registered === 1);

    var begin = json.begin === null ? null : timeUtils.parseDate(json.begin);
    var end = json.begin === null ? null : timeUtils.parseDate(json.end);

    defineSimpleGetter(this, 'begin', begin);
    defineSimpleGetter(this, 'end', end);

    var activitiesShortNames = [];
    for (var i = 0; i < json.activites.length; i++) {
        var activity = json.activites[i];
        activitiesShortNames.push(activity.codeacti);
    }

    var activitiesIDs = [];
    for (var i = 0; i < activitiesShortNames.length; i++) {
        var activity = new ActivityID(this.id, activitiesShortNames[i]);
        activitiesIDs.push(activity);
    }
    defineSimpleGetter(this, 'activitiesIDs', activitiesIDs);
}

/** Returns an ActivityID or null */
Module.prototype.getActivityID = function (shortName) {
    for (var i = 0; i < this.activitiesIDs.length; i++) {
        var id = this.activitiesIDs[i];
        if (id.shortName === shortName)
            return id;
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

    s += 'activitiesIDs:\n'
    for (var i = 0; i < this.activitiesIDs.length; i++) {
        var id = this.activitiesIDs[i];
        s += '    ' + id + '\n';
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

Module.get = function (epitech, moduleID, callback) {
    moduleID = ModuleID.create(moduleID);

    var path = 'module/' + moduleID
    epitech.session.requestJSON(path, function (error, json) {
        if (error)
            return callback(error, null);

        var module = new Module(epitech, json);
        callback(null, module);
    });
}

Module.getIDs = function (session, callback) {
    session.requestJSON('course/filter', function (error, json) {
        if (error)
            return callback(error, null);

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



function Epitech(session, json) {
    Model.call(this, this);

    defineSimpleGetter(this, 'session', session);

    /** If not null, this is a list of the IDs of some modules */
    this._modulesIDs = null;

    this._modules = [];
    this._activities = [];
}

Epitech.prototype.getModulesIDs = function (callback) {
    if (this._modulesIDs !== null)
        return callback(null, this._modulesIDs);

    var self = this;
    Module.getIDs(this.session, function (error, ids) {
        if (error !== null)
            return callback(error, null);

        self._modulesIDs = ids;
        callback(null, ids);
    });
}

Epitech.prototype._getCachedModule = function (id) {
    for (var i = 0; i < this._modules.length; i++) {
        var module = this._modules[i];
        if (module.id.equals(id))
            return module;
    }
    return null;
}

Epitech.prototype.getModule = function (id, callback) {
    var module = this._getCachedModule(id);
    if (module !== null)
        return callback(null, module);

    var self = this;
    Module.get(this, id, function (error, module) {
        if (error !== null)
            return callback(error, null);

        self._modules.push(module);
        callback(null, module);
    });
}

/*

Epitech.prototype.getActivity = function (id) {
    for (var i = 0; i < this.modules.length; i++) {
        var module = this.modules[i];
        var activity = module.getActivity(shortName);
        if (activity)
            return activity;
    }
    return null;
}
*/

Epitech.getJSON = function (session, callback) {
    session.requestJSON('', function (error, text) {
        if (error)
            return callback(error, null);

        callback(null, text);
    });
}

Epitech.get = function (session, callback) {
    Epitech.getJSON(session, function (error, json) {
        if (error)
            return callback(error, null);

        var epitech = new Epitech(session, json);
        callback(null, epitech);
    });
}

/*
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
*/



module.exports = {
    timeUtils: timeUtils,

    ActivityID: ActivityID,
    Epitech: Epitech,
    Event: Event,
    Module: Module,
    ModuleID: ModuleID,
    OwnStudent: OwnStudent,
    Session: Session,
    Student: Student,
};
