/* Developer version of Codility's logger. */

var DevelLog = {
    handle : function(level, type, msg, exception) {
        var s = "[" + level + "]" + " " + type;
        if (msg)
            s += ", " + msg;
        if (exception)
            s += " (exception: " + exception + ")";
        if (window.console)
            window.console.log(s);
    },

    flush: function() {},

    debug : function(type, msg, exception) {
        this.handle("DEBUG", type, msg, exception);
    },

    info : function(type, msg, exception) {
        this.handle("INFO", type, msg, exception);
    },

    warning : function(type, msg, exception) {
        this.handle("WARNING", type, msg, exception);
    },

    error : function(type, msg, exception) {
        this.handle("ERROR", type, msg, exception);
        this.flush();
    }
};
