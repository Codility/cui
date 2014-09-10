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


/* global TestServer */

function LocalServer() {
    var self = TestServer();

    self.use_asserts = false;

    var super_init = self.init;
    self.init = function() {
        super_init();
        setTimeout(self.beat, self.BEAT_PERIOD);
    };

    self.BEAT_PERIOD = 200;
    self.RESPONSE_DELAY = 150;
    self.VERIFY_DELAY = 700;
    self.beat = function() {
        self.respond(self.RESPONSE_DELAY);
        self.verifySubmits(self.VERIFY_DELAY);
        setTimeout(self.beat, self.BEAT_PERIOD);
    };

    // just return first open task
    self.getNextTask = function() {
        for (var i = 0; i < self.task_names.length; i++) {
            var task_name = self.task_names[i];
            if (self.tasks[task_name].status != 'closed')
                return task_name;
        }
        return '';
    };

    self.verifySubmits = function(timeout) {
        for (var i = 0; i < self.submits.length; i++) {
            var submit = self.submits[i];

            if (submit.mode != 'verify' || submit.result || submit.in_eval)
                continue;
            setTimeout($.proxy(self.verifySubmit, self, submit), timeout);
            submit.in_eval = true;
        }
    };

    self.verifySubmit = function(submit) {
        submit.in_eval = false;
        if (/^ *fail()/mi.test(submit.solution)) {
            submit.result = {
                'compile': {'ok': 1,
                            'message': 'The solution compiled flawlessly.'},
                'example': {'ok': 0,
                            'message': 'RUNTIME ERROR (you invoked the fail() function)'}
            };
        } else {
            submit.result = {
                'compile': {'ok': 1,
                            'message': 'The solution compiled flawlessly.'},
                'example': {'ok': 1,
                            'message': 'OK'}
            };
        }
    };

    self.getTaskStart = function(task, human_lang, prg_lang) {
        var header = [
            '',
            '// You\'re running an in-browser mock server for the CUI.',
            '// It will allow you to test the interface, but will not',
            '// actually assess the solutions.',
            '',
            '// This is a starting solution for task="' + task + '", prg_lang="'+ prg_lang + '".',
            '',
        ].join('\n');

        var sol;
        if (prg_lang == 'sql') {
            sol = [
                'FAIL; -- comment this out for the solution to pass',
                '',
                'SELECT 42;',
            ].join('\n');
            header = header.replace(/\/\/ /g, '-- ');
        } else {
            sol = [
                'int solution() {',
                '    fail(); // comment this out for the solution to pass',
                '',
                '    return 42;',
                '}'
            ].join('\n');
        }
        return header + '\n' + sol;
    };

    return self;
}
