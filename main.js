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

function fetchEpitech(login, password) {
    var session = new tek.Session(login, password);

    var epitechRequest = tek.Epitech.getEpitechRequest(session);
    epitechRequest.on('end', function (epitech) {
        process.stdout.write('\r');
        printEpitech(epitech);
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
        if (error) {
            console.log('Error');
            return;
        }

        readPassword(function(error, password) {
            if (error) {
                console.log('Error');
                return;
            }

            fetchEpitech(login, password);
        });
    });
}

main();
