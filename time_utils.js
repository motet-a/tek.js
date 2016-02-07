var Moment = require('moment');



function isBetweenInc(moment, start, end) {
    return start.isSameOrBefore(moment) && end.isSameOrAfter(moment);
}

function durationContainsMoment(startMoment, duration, moment) {
    return isBetweenInc(moment,
                        startMoment,
                        startMoment.clone().add(duration));
}

function durationContainsEvent(begin, duration, event) {
    if (event.contains(begin) ||
        event.contains(begin.clone().add(duration)))
        return true;

    return durationContainsMoment(begin, duration, event.begin) &&
        durationContainsMoment(begin, duration, event.end);
}

function filterEvents(begin, duration, events) {
    var filtered = [];
    for (var i = 0; i < events.length; i++) {
        if (durationContainsEvent(begin, duration, events[i]))
            filtered.push(events[i]);
    }
    return filtered;
}

function filterEventsInDay(dayBegin, events) {
    return filterEvents(dayBegin, Moment.duration(1, 'days'), events);
}

function filterEventsInWeek(weekBegin, events) {
    return filterEvents(weekBegin, Moment.duration(1, 'weeks'), events);
}


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


module.exports = {
    isBetweenInc: isBetweenInc,
    filterEvents: filterEvents,
    filterEventsInDay: filterEventsInDay,
    filterEventsInWeek: filterEventsInWeek,

    parseDate: parseDate,
    parseTimeDuration: parseTimeDuration,
    parseDateTime: parseDateTime,
};
