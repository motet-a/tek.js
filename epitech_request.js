
function EpitechRequest(session) {
    this.session = session;
    this.events = {};
    this.childRequests = [];
    this.result = null;
}

EpitechRequest.prototype.addChildRequest = function (request) {
    var self = this;
    request.on('error', function (error) {
        self.fireEvent('error', error);
    });
    request.on('end', function (result) {
        self.fireEvent('update');
    });
    this.childRequests.push(request);
    this.fireEvent('update');
}

EpitechRequest.prototype.isFinished = function () {
    return this.result !== null;
}

EpitechRequest.prototype.areChildrenFinished = function () {
    for (var i = 0; i < this.childRequests.length; i++) {
        var child = this.childRequests[i];
        if (!child.isFinished())
            return false;
    }
    return true;
}

EpitechRequest.prototype.getFinishedChildrenCount = function () {
    var count = 0;
    for (var i = 0; i < this.childRequests.length; i++) {
        var child = this.childRequests[i];
        if (child.isFinished())
            count++;
    }
    return count;
}

EpitechRequest.prototype.getChildResults = function () {
    var results = [];
    for (var i = 0; i < this.childRequests.length; i++) {
        var child = this.childRequests[i];
        results.push(child.result);
    }
    return results;
}

EpitechRequest.prototype.on = function (eventName, handler) {
    var handlers = this.events[eventName];
    if (Array.isArray(handlers))
        handlers.push(handler);
    else
        this.events[eventName] = [handler];
}

EpitechRequest.prototype.fireEvent = function () {
    // Converts the arguments to a real array
    var params = Array.prototype.slice.call(arguments);
    var eventName = params[0];
    params.shift();
    var handlers = this.events[eventName];
    if (!Array.isArray(handlers))
        return;
    for (var i = 0; i < handlers.length; i++)
        handlers[i].apply(null, params);
}

EpitechRequest.prototype.fireEnd = function (result) {
    this.result = result;
    this.fireEvent('end', result);
}

EpitechRequest.prototype.getProgressFloat = function () {
    if (this.isFinished())
        return 1.0;
    if (this.childRequests.length == 0)
        return 0.0;
    return this.getFinishedChildrenCount() / this.childRequests.length;
}

module.exports.EpitechRequest = EpitechRequest;
