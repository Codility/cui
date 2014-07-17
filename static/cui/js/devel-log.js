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
