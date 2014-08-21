var SeleniumReporter = function () {
    'use strict';
    var pub, priv;

    pub = {
    };

    priv = {
        events: [],
        allEvents: [],
        callbacks: [],
        finished: false
    };

    // jasmine reporter functions
    pub.jasmineStarted = function (options) {
        priv.emit("jasmine_started", options);
    };

    pub.jasmineDone = function () {
        priv.emit("jasmine_done", null);
        priv.finished = true;
    };

    pub.suiteStarted = function (result) {
        priv.emit("suite_started", result);
    };

    pub.suiteDone = function (result) {
        priv.emit("suite_done", result);
    };

    pub.specStarted = function (result) {
        priv.emit("spec_started", result);
    };

    pub.specDone = function (result) {
        priv.emit("spec_done", result);
    };

    // comunication with selenium
    pub.addCallback = function (callback) {
        priv.callbacks.push(callback);
        priv.runCallbacks();
    };

    pub.getAllEvents = function () {
        return priv.allEvents;
    };

    pub.isFinished = function () {
        return priv.finished;
    };

    // private functions
    priv.runCallbacks = function () {
        while (priv.callbacks.length > 0 && priv.events.length > 0) {
            priv.callbacks[0](priv.events[0]);
            priv.callbacks.shift();
            priv.events.shift();
        }
    };

    priv.emit = function (name, data) {
        var e = {name: name, data: data};
        priv.events.push(e);
        priv.allEvents.push(e);
        priv.runCallbacks();
    };

    return pub;
};
