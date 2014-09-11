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

/* global Log */
/* global xmlNodeValue */
/* global ui */

var Clock = {
    CLOCK_REFRESH_TIME : 2*60*1000, // 2 minutes
    timeout_warning_active : false,
    time_to_end : null,
    active : true,
    timeout_temp_disabled : false,  // temporarily disable checking timeout, see Trac #2714

    setTime : function(time_to_end) {
        if (typeof time_to_end !== 'number'){
            time_to_end = this.time_to_end;
        }
        var seconds = time_to_end % 60;
        var minutes = Math.floor(time_to_end / 60) % 60;
        var hours = Math.floor(time_to_end / (60 * 60));
        var time_string = (hours < 10) ? '0' + hours : hours;
        time_string += ":";
        time_string += (minutes < 10) ? '0' + minutes : minutes;
        time_string += ":";
        time_string += (seconds < 10) ? '0' + seconds : seconds;
        $('#clock').text(time_string);
    },

    init : function(ticket_id, url, time_remaining_sec, time_elapsed_sec) {
        this.ticket_id = ticket_id;
        this.url = url;
        this.timeout_warning_active = false;
        this.time_from_start = time_elapsed_sec;
        this.time_to_end = time_remaining_sec;
        this.active = true;
        this.setTime();
        var that = this;
        setTimeout(function() { that.clock_tick();}, 1000);
        this.refreshClock();
        window.onbeforeunload = function(e) {
            if (Clock.active)
                return 'Are you sure you want to close the window?\n' +
                    'If you have finished, use the SUBMIT button.\n' +
                    'If the interface is not responding (e.g. connection issues), it\'s acceptable to reload.';
            else
                return undefined; //IE9 needs undefined, not null
        };
    },

    clock_tick : function() {
        if (!Clock.active) return;
        this.time_to_end -= 1;
        this.setTime();
        if (this.time_to_end == 60 || this.time_to_end == 2 * 60 || this.time_to_end == 3 * 60) {
            this.startTimeoutWarning(15);
        }

        if (this.time_to_end <= 0) {
            ui.actionTimeout();
        }
        else {
            var that = this;
            setTimeout(function() { that.clock_tick();}, 1000);
        }
    },


    _update : function(data) {
        var result = xmlNodeValue(data, 'response result');
        if (result == "ERROR") {
            var t = String(xmlNodeValue(data, 'response message'));
            if (t.match("closed") !== null) {
                if (!this.timeout_temp_disabled) {
                    Log.info('Ticket closed by server');
                    ui.actionTimeout(true);
                }
            }
            else {
                Log.error('Update clock error');
            }
        }
        else {
            var new_timelimit = parseInt(xmlNodeValue(data,'response new_timelimit'), 10);
            var new_time_elapsed = parseInt(xmlNodeValue(data,'response new_time_elapsed'), 10);
            var diff = xmlNodeValue(data,'response diff');
            Log.debug('candidate update clock', 'new_timelimit: '+new_timelimit+(diff!=="" ? " diff="+diff : ""));
            if (new_timelimit>0) {
                this.time_to_end = new_timelimit;
                this.time_from_start = new_time_elapsed;
            }
        }
    },

    refreshClock : function() {
        var that = this;
        this.clockAction();
        setTimeout(function() { that.refreshClock(); }, this.CLOCK_REFRESH_TIME);
    },

    clockAction : function() {
        var that = this;
        Log.debug('candidate clock action');
        var data = {'ticket': this.ticket_id, 'old_timelimit': this.time_to_end };
        $.ajax({
            url: this.url,
            data: data,
            type: 'POST',
            success: function(d) { that._update(d); },
            timeout: 30*1000
        });
    },

    startTimeoutWarning : function(n) {
        Log.info("candidate timeout warning showed");
        if (this.timeout_warning_active) return;

        this.timeout_warning_active = true;

        var clock_id = '#clock';

        $(clock_id).fadeOut(100);
        $(clock_id).fadeOut(1, function() { $(clock_id).css({backgroundColor: 'red'}); });

        var i;
        for(i=0;i<n;i++) {
            $(clock_id).fadeIn(250);
            $(clock_id).fadeOut(250);
        }

        $(clock_id).fadeIn(1, function() { $(clock_id).css({backgroundColor: ''}); });
        $(clock_id).fadeIn(100);

        var that = this;
        setTimeout(function() {
            that.timeout_warning_active = false;
        }, 5000);
    }

};
