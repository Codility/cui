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

// Freshchat-based chat for CUI.

function Chat(chat_options) {
    var self = {};
    self.options = chat_options;

    self.load = function() {
        // Adapted from standard Freshchat code

        var fc_CSS=document.createElement('link');
        fc_CSS.setAttribute('rel','stylesheet');
        var isSecured = (window.location && window.location.protocol == 'https:');
        fc_CSS.setAttribute('type','text/css');
        fc_CSS.setAttribute('href',((isSecured)? 'https://d36mpcpuzc4ztk.cloudfront.net':'http://assets1.chat.freshdesk.com')+'/css/visitor.css');
        document.getElementsByTagName('head')[0].appendChild(fc_CSS);
        var fc_JS=document.createElement('script'); fc_JS.type='text/javascript';
        var jsload = (typeof jQuery=='undefined')?'visitor-jquery':'visitor';
        fc_JS.src=((isSecured)?'https://d36mpcpuzc4ztk.cloudfront.net':'http://assets.chat.freshdesk.com')+'/js/'+jsload+'.js';
        document.body.appendChild(fc_JS);
        window.freshchat_setting=self.options.freshchat_setting;
    };

    self.getState = function() {
        if (!window.freshchat_setting)
            return 'unloaded';
        else if ($('#fc_chat_header').length === 0)
            return 'loading';
        else
            return 'ready';
    };

    // Wait until Freshchat is loaded, then execute onRead after additional
    // delay (to allow it to open if it starts opened).
    self.waitUntilReady = function(delay, onReady, onFailure) {
        var n_tries = 15, interval = 300;
        function poll() {
            if (self.getState() === 'ready')
                setTimeout(onReady, delay);
            else if (n_tries-- > 0)
                setTimeout(poll, interval);
            else
                onFailure();
        }

        poll();
    };

    self.isOpened = function() {
        return $('#fc_chat_window').is(':visible');
    };

    self.open = function() {
        $('#fc_chat_header').click();
    };

    self.pulse = function() {
        $('#fc_chat_layout').animate({
            'transform': 'scale(1.2)'
        }, 200).animate({
            'transform': 'scale(1)'
        }, 200);
    };

    self.fail = function() {
        Console.msg_error("Sorry, loading the chat failed.<br>" +
                          "If you require assistance, please contact " +
                          "<a href='mailto:" + self.options.support_email +
                          "' target=_blank>" + self.options.support_email + "</a>.");
        Log.error("couldn't load freshchat");
    };

    // DWIM: show Freshchat and attract user's attention
    // (by opening it, or animating it if it's open).
    self.activate = function() {
        var state = self.getState();
        if (state === 'unloaded')
            self.load();
        if (state === 'unloaded' || state === 'loading') {
            self.waitUntilReady(
                500,
                function() {
                    if (!self.isOpened())
                        self.open();
                },
                self.fail);
        } else {
            if (self.isOpened())
                self.pulse();
            else
                self.open();
        }
    };

    return self;
}
