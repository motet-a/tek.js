var ModuleID = require('./module_id.js').ModuleID;
var _model = require('./model.js');
var defineGetter = _model.defineGetter;
var defineSimpleGetter = _model.defineSimpleGetter;


function ActivityID(moduleID, activityShortName) {
    moduleID = ModuleID.create(moduleID);
    defineSimpleGetter(this, 'moduleID', moduleID);
    defineSimpleGetter(this, 'shortName', activityShortName);
}

ActivityID.prototype.toString = function () {
    return this.moduleID.toString() + '/' + this.shortName;
}

ActivityID.prototype.equals = function (other) {
    return this.toString() === other.toString();
}



module.exports = {
    ActivityID: ActivityID,
}
