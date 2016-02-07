
function defineGetter(object, name, getterFunction) {
    Object.defineProperty(object, name, {
        get: getterFunction,
    });
}

function defineSimpleGetter(object, name, value) {
    defineGetter(object, name, function () {return value});
}



function EventListener(eventName, listenerFunction) {
    defineGetter(this, 'event', function () {return eventName});
    defineGetter(this, 'listenerFunction', function () {
        return listenerFunction;
    });
}



function Model(epitech) {
    defineGetter(this, 'epitech', function () {return epitech});

    var listeners = [];
    defineGetter(this, '_listeners', function () {return listeners});
}

Model.prototype._getListeners = function (eventName) {
    var listeners = [];
    for (var i = 0; i < this._listeners; i++) {
        var listener = this._listener;
        if (eventName === listener.event)
            listeners.push(listener);
    }
    return listeners;
}

Model.prototype.fireEvent = function (eventName, sourceModel, args) {
    var listeners = this._getListeners(eventName);
    for (var i = 0; i < listeners; i++) {
        listeners[i].listenerFunction(sourceModel, args);
    }
}

Model.prototype.fireUpdate = function () {
    this.fireEvent('update', this, []);
}

Model.prototype.fireDelete = function () {
    this.fireEvent('delete', this, []);
}

Model.prototype.on = function (eventName, listenerFunction) {
    this._listeners.push(new EventListener(eventName, listenerFunction));
}

Model.prototype.accept = function (visitor) {
    throw new Error('Not implemented');
}

Model.prototype.listenToChild = function (child) {
    var self = this;
    child.on('update', function (source, args) {
        self.fireEvent('update', source, args);
    })
    child.on('delete', function (source, args) {
        self.fireEvent('update', source, args);
    })
}



module.exports = {
    defineGetter: defineGetter,
    defineSimpleGetter: defineSimpleGetter,
    EventListener: EventListener,
    Model: Model,
};
