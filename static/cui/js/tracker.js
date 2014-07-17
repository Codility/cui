/*!

    Copyright (C) 2014 Codility Limited. <https://codility.com>

    This file is part of Candidate User Interface (CUI).

    CUI is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version accepted in a public statement
    by Codility Limited.

    CUI is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with CUI.  If not, see <http://www.gnu.org/licenses/>.

*/


// Suppress dot-notation warnings:
/*jshint sub: true */

// Warn about globals.
/*jshint undef: true, browser: true, jquery: true */
/*global Log */
/*global console */
/*global Clock */
function TimeTracker(name, time_elapsed_sec)
{
    var self = {
        name: name,
        // timestamp in sec of the tracker initialization,
        //   div by 1000 since getTime returns time in mili-seconds
        start_time: new Date().getTime()/1000-time_elapsed_sec,
        interval: 60, // in seconds

        // data[i] represents number of events in time [ start_time+i*interval .. start_time+(i+1)*interval )
        data: {},

        // fields for handling turnOn, turnOff
        status: null, // current status 1-on, 0-off, null-no information
        last_t: null  // last time when status has been updated
    };

    self.updateClock = function(new_time_elapsed_sec) {
        self.start_time = new Date().getTime()/1000-new_time_elapsed_sec;
    };

    self.reset = function() {
        // console.log("reset! name="+self.name);
        self.data = {};
        if (self.status !== null) {
            self.last_t = self.current_t();
            self.updateStatus(self.status);
        }
    };

    self.tick = function(c) {
        var t = self.current_t();
        if (!(t in self.data)) self.data[t] = 0;
        if (c===undefined)
            self.data[t] += 1;
        else
            self.data[t] += c;
        // console.log("tick! name="+self.name+" t="+t+" v="+self.data[t]);
    };

    self.updateStatus = function(new_status) {
        var t = self.current_t();
        if (self.status !== null && self.last_t !== null) {
            for(var i=self.last_t+1;i<t;i++)
                self.data[i] = self.status;
        }
        if (!(t in self.data) || new_status===1) self.data[t] = new_status;
        self.status = new_status;
        self.last_t = t;
    };

    self.turnOn = function() {
        // console.log("tracker: "+self.name+" t="+self.current_t()+" turnOn");
        self.updateStatus(1);
    };

    self.turnOff = function() {
        // console.log("tracker: "+self.name+" t="+self.current_t()+" turnOff");
        self.updateStatus(0);
    };

    self.print = function() {
        if (self.status !== null) self.updateStatus(self.status);
        console.log("Tracker: "+self.name+" interval="+self.interval+" data="+JSON.stringify(self.data));
    };

    self.exportData = function() {
        if (self.status !== null) self.updateStatus(self.status);
        return [self.data, self.interval];
    };

    self.current_t = function() {
        var t = (new Date().getTime()/1000) - self.start_time;
        return Math.floor(t / self.interval);
    };

    self.data = {};
    self.status = null;
    return self;
}
