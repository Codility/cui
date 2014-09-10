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
var Console = {
    level : "ERROR",
    setLevel : function(level) {
        this.level = level;
    },

    _levelValue : function(level) {
        if (level == "ERROR") return 40;
        if (level == "WARNING") return 30;
        if (level == "INFO") return 20;
        if (level == "DEBUG") return 10;
        return 0;
    },

    filter : function(log_level) {
        var act_value = this._levelValue(this.level);
        var value = this._levelValue(log_level);
        if (value >= act_value)
            return true;
        else
            return false;
    },

    log : function(log_level, type, msg) {
        var curr_level = this._levelValue(this.level);
        var this_level = this._levelValue(log_level);
        if (this_level >= curr_level)
            this._log(log_level, type, msg);
    },

    _log : function(log_level, type, msg) {
        var msgtxt;
        if (msg) {
            msgtxt = type + "," + msg;
        }
        else {
            msgtxt = type;
        }

        var color = "black";
        if (log_level == "ERROR") {
            color = "red";
        }
        $('#console').append('<div style="color:'+color+';font-family:\'Droid Sans Mono\', monospace; font-size: 14px">'+ msgtxt+'</div><br/>');
        $("#console").scrollTop($("#console").prop("scrollHeight"));
    },

    _msg : function(msg, color) {
        if (!color)
            color = "black";
        $('#console').append('<div style="color:'+color+';font-family:\'Droid Sans Mono\', monospace; font-size: 14px">'+ msg+'</div><br/>');
        $("#console").scrollTop($("#console").prop("scrollHeight"));
    },

    msg : function(msg) {
        Log.info("candidate console message", msg);
        this._msg(msg, "black");
    },

    msg_error : function(msg) {
        Log.info("candidate console message", msg);
        this._msg(msg, "red");
    },

    msg_ok : function(msg) {
        Log.info("candidate console message", msg);
        this._msg(msg, "green");
    },
    msg_quote : function(msg) {
        Log.info("candidate console message", msg);
        $('#console').append('<div class="quote">'+msg+'</div>');
        $("#console").scrollTop($("#console").prop("scrollHeight"));
    },

    msg_syserr : function(msg) {
        Log.warning("candidate console message", msg);
        this._msg(msg, "red");
    },

    clear : function() {
        Log.info("candidate console clear");
        $('#console').html('');
    }
};
