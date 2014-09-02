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

/* global Log, Console */
/* global olark */
/* global ui */

// Olark-based chat for CUI.
// Requires the standard Olark code to be loaded.

function Chat(support_email) {
    var self = {
        available: false,
        expanded: false,
        shown: false,
        support_email: support_email,
    };

    self.init = function() {
        olark('api.chat.onOperatorsAvailable', function() { self.available = true; });
        olark('api.chat.onOperatorsAway', function() { self.available = false; });
        olark('api.box.onExpand', function() { self.expanded = true; });
        olark('api.box.onShrink', function() { self.expanded = false; });
        olark('api.box.onShow', function() { self.shown = true; });
        olark('api.box.onHide', function() { self.shown = false; });

        olark('api.visitor.updateCustomFields', {
            report_url: window.location.host + '/tickets/' + ui.options.ticket_id
        });
    };

    // Wait until the chat window is loaded and expanded, then execute onReady.
    self.waitUntilReady = function(onReady, onFailure) {
        var n_tries = 15, interval = 300;
        function poll() {
            if (self.shown && self.expanded)
                onReady();
            else if (n_tries-- > 0)
                setTimeout(poll, interval);
            else
                onFailure();
        }

        poll();
    };

    self.pulse = function() {
        $('#habla_window_div').animate({
            'transform': 'scale(1.2)'
        }, 200).animate({
            'transform': 'scale(1)'
        }, 200);
    };

    self.fail = function(err) {
        Console.msg_error("Sorry, loading the chat failed.<br>" +
                          "If you require assistance, please contact " +
                          "<a href='mailto:" + self.support_email +
                          "' target=_blank>" + self.support_email + "</a>.");
        Log.error("couldn't load candidate chat", err);
    };

    // DWIM: show Olark chat and attract user's attention.
    self.activate = function() {
        if (!self.shown)
            olark('api.box.show');
        if (!self.expanded)
            olark('api.box.expand');

        self.waitUntilReady(self.pulse, self.fail);
    };

    self.init();

    return self;
}
