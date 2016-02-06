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


function printOwnStudent(epitech, session, args, callback) {
    console.log(epitech.ownStudent);
    callback(epitech, session);
}


function printStudent(epitech, session, args, callback) {
    if (args.length === 0) {
        console.log(epitech.ownStudent);
        return;
    }

    tek.Student.get(session, args[0], function (error, student) {
        if (error)
            console.log('Error');
        else
            console.log(student);
        callback(epitech, session);
    });
}

function printModule(epitech, session, args, callback) {
    if (args.length === 0) {
        console.warn('Expected a module name');
        callback(epitech, session);
        return;
    }

    var module = epitech.getModule(args[0]);
    if (module) {
        console.log(module.toString());
    } else {
        console.warn('Unknown module ' + args[0]);
    }
    callback(epitech, session);
}

var commands = {
    me: printOwnStudent,
    ownstudent: printOwnStudent,
    student: printStudent,
    module: printModule,
};

function runCommand(epitech, session, args, callback) {
    var name = args[0];
    args.shift();

    var command = commands[name];

    if (command) {
        command(epitech, session, args, callback);
    } else {
        console.warn('Invalid command');
        callback(epitech, session);
    }
}

function readAndRunCommand(epitech, session) {
    readCommand(function (commandString) {
        var commandArray = commandString.trim().split(' ');

        if (commandArray.length > 0 && commandArray[0] !== '') {
            if (commandArray[0] === 'exit')
                return;
            runCommand(epitech, session, commandArray, readAndRunCommand);
        } else {
            readAndRunCommand(epitech, session);
        }
    });
}

function fetchEpitech(login, password) {
    var session = new tek.Session(login, password);

    var epitechRequest = tek.Epitech.getEpitechRequest(session);
    epitechRequest.on('end', function (epitech) {
        process.stdout.write('\r');
        readAndRunCommand(epitech, session);
    });
    epitechRequest.on('error', function (error) {
        process.stdout.write('\r');
        console.log('Error:');
        console.log(error);
    });
    epitechRequest.on('update', function () {
        if (epitechRequest.isFinished())
            return;
        var pf = epitechRequest.getProgressFloat();
        process.stdout.write('\r');
        process.stdout.write(Math.round(pf * 100) + '%');
    });
}

function main() {
    readLogin(function(error, login) {
        if (error)
            return;

        readPassword(function(error, password) {
            if (error)
                return;

            fetchEpitech(login, password);
        });
    });
}

main();
