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
        $('#cui_console').append('<div style="color:'+color+';">'+ msgtxt+'</div><br/>');
        $("#cui_console").scrollTop($("#cui_console").prop("scrollHeight"));
    },

    _msg : function(msg, color) {
        if (!color)
            color = "black";
        $('#cui_console').append('<div style="color:'+color+';">'+ msg+'</div><br/>');
        $("#cui_console").scrollTop($("#cui_console").prop("scrollHeight"));
    },

    addHtml : function(html) {
        $('#cui_console').append(html);
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
        $('#cui_console').append('<div class="quote">'+msg+'</div>');
        $("#cui_console").scrollTop($("#cui_console").prop("scrollHeight"));
    },

    msg_syserr : function(msg) {
        Log.warning("candidate console message", msg);
        this._msg(msg, "red");
    },

    clear : function() {
        Log.info("candidate console clear");
        $('#cui_console').html('');
    },

    add_loader : function(msg) {
        var $loader = $('.loader').clone();
        $loader.find('.message').text(msg);
        $('#cui_console').append($loader);
        $loader.show();
    },

    add_loader_comment : function(comment) {
        $('#cui_console .loader .comment').text(comment);
    },

    remove_loader : function() {
        $('#cui_console .loader').remove();
    },
};
