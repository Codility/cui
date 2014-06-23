/* global Log */
/* global xmlNodeValue */
/* global ui */

var Clock = {
    CLOCK_REFRESH_TIME : 2*60*1000, // 2 minutes
    timeout_warning_active : false,
    time_to_end : null,
    active : true,

    setTime : function() {
        var seconds = this.time_to_end % 60;
        var minutes = Math.floor(this.time_to_end / 60) % 60;
        var hours = Math.floor(this.time_to_end / (60 * 60));
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
        this.clock_tick();
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
        this.setTime();
        if (this.time_to_end == 60 || this.time_to_end == 2 * 60 || this.time_to_end == 3 * 60) {
            this.startTimeoutWarning(15);
        }

        if (this.time_to_end <= 0) {
            if (!$("#msg_final_task_completed").is(":visible")) {
                this.actionTimeout();
            }
        }
        else {
            var that = this;
            this.time_to_end -= 1;
            setTimeout(function() { that.clock_tick();}, 1000);
        }
    },


    _update : function(data) {
        var result = xmlNodeValue(data, 'response result');
        if (result == "ERROR") {
            var t = String(xmlNodeValue(data, 'response message'));
            if (t.match("closed") !== null) {
                // TODO: notify CandidateUi
                if (!$("#msg_final_task_completed").is(":visible")) {
                    Log.info('Ticket closed by server');
                    this.actionTimeout();
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

    actionTimeout : function() {
        ui.notifyCheckerTimeoutAction();
        $('#msg_timeout').jqmShow();
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
