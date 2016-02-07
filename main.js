var tek = require('./tek.js');
var read = require('read');
var Moment = require('moment');


function readLogin(callback) {
    return read({
        prompt: 'Login: '
    }, callback);
}

function readPassword(callback) {
    return read({
        prompt: 'Password: ',
        silent: true
    }, callback);
}

function readCommand(callback) {
    return read({
        prompt: '>>> '
    }, function (error, text) {
        if (error)
            return;

        callback(text);
    });
}



function printEpitech(epitech) {
    console.log('Your name is ' + epitech.ownStudent.firstName);
    console.log('\nModules:');
    for (var i = 0; i < epitech.modules.length; i++) {
        console.log(epitech.modules[i].name);
    }

    console.log('\n############## Events:');

    var events = tek.timeUtils.filterEventsInDay(
        Moment().startOf('day'),
        epitech.getEvents());

    for (var i = 0; i < events.length; i++) {
        console.log('activity: ' + events[i].activity.name);
        console.log('begin: ' + events[i].begin.calendar());
        console.log('end: ' + events[i].end.calendar());
        console.log();
    }
}


function printOwnStudent(epitech, args, callback) {
    console.log(epitech.ownStudent);
    callback(epitech);
}


function printStudent(epitech, args, callback) {
    if (args.length === 0) {
        console.log(epitech.ownStudent);
        return;
    }

    tek.Student.get(epitech.session, args[0], function (error, student) {
        if (error)
            console.log('Error');
        else
            console.log(student);
        callback(epitech);
    });
}

function printModules(epitech, args, callback) {
    epitech.getModulesIDs(function (error, ids) {
        if (error) {
            console.warn(error);
            callback(epitech);
            return;
        }

        for (var i = 0; i < ids.length; i++)
            console.info(ids[i].toString());

        callback(epitech);
    });
}

function printModule(epitech, args, callback) {
    if (args.length === 0) {
        console.warn('Expected a module ID');
        callback(epitech);
        return;
    }

    var moduleID;
    try {
        moduleID = tek.ModuleID.fromString(args[0]);
    } catch (e) {
        console.warn('Invalid module ID: ' + e);
        callback(epitech);
        return;
    }

    var module = epitech.getModule(moduleID, function (error, module) {
        if (error !== null) {
            console.warn('Error: ' + error);
            callback(epitech);
            return;
        }

        console.log(module.toString());
        callback(epitech);
    });
}

function printActivities(epitech, args, callback) {
    var activities = epitech.getActivities();
    for (var i = 0; i < activities.length; i++) {
        var activity = activities[i];
        console.info(activity.shortName + '\t' + activity.name);
    }
    callback(epitech);
}

function printActivity(epitech, args, callback) {
    if (args.length === 0) {
        console.warn('Expected an activity name');
        callback(epitech);
        return;
    }

    var activity = epitech.getActivity(args[0]);
    if (activity) {
        console.log(activity.toString());
    } else {
        console.warn('Unknown activity ' + args[0]);
    }
    callback(epitech);
}

var commands = {
    me: printOwnStudent,
    ownstudent: printOwnStudent,
    student: printStudent,
    module: printModule,
    modules: printModules,
    activities: printActivities,
    activity: printActivity,
    acti: printActivity,
};

function runCommand(epitech, args, callback) {
    var name = args[0];
    args.shift();

    var command = commands[name];

    if (command) {
        command(epitech, args, callback);
    } else {
        console.warn('Invalid command');
        callback(epitech);
    }
}

function readAndRunCommand(epitech) {
    if (!(epitech instanceof tek.Epitech))
        throw new Error();

    readCommand(function (commandString) {
        var commandArray = commandString.trim().split(' ');

        if (commandArray.length > 0 && commandArray[0] !== '') {
            if (commandArray[0] === 'exit')
                return;
            runCommand(epitech, commandArray, readAndRunCommand);
        } else {
            readAndRunCommand(epitech);
        }
    });
}

function fetchEpitech(login, password) {
    var session = new tek.Session(login, password);

    tek.Epitech.get(session, function (error, epitech) {
        if (error) {
            console.log('Error:');
            console.log(error);
            return;
        }

        readAndRunCommand(epitech);
    });
}

function main() {
    readLogin(function (error, login) {
        if (error)
            return;

        readPassword(function (error, password) {
            if (error)
                return;

            fetchEpitech(login, password);
        });
    });
}

main();
