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


/* global jasmine, expect */
/* global sinon */
/* global console */
/* global getParams */

function TestServer() {
    var self = {
        'tasks': {
            'task1': {
                'status': 'open',
                'human_lang_list': ['en', 'cn'],
                'prg_lang_list': ['c', 'cpp'],
                'type': 'algo',
                'saved': null,
                'n_saves': 0
            },
            'task2': {
                'status': 'open',
                'human_lang_list': ['en', 'cn'],
                'prg_lang_list': ['c', 'cpp'],
                'type': 'bugfixing',
                'saved': null,
                'n_saves': 0
            },
            'task3': {
                'status': 'open',
                'human_lang_list': ['en'],
                'prg_lang_list': ['sql'],
                'type': 'sql',
                'saved': null,
                'n_saves': 0
            },
        },
        'task_names': ['task1', 'task2', 'task3'],
        'current_task': 'task1',
        'next_task': '',
        'submits': [],
        // ticket remaining time at server time = 0
        'time_at_start': 1800,
        'timed_out': false,
        'survey_submitted': false
    };

    self.use_asserts = true;

    self.ui_options = {
        ticket_id: "TICKET_ID",

        time_elapsed_sec: 15,
        time_remaining_sec: 1800,

        current_human_lang: "en",
        current_prg_lang: "c",
        current_task_name: "task1",

        task_names: ["task1", "task2", "task3"],

        human_langs: {
            "en": {"name_in_itself": "English"},
            "cn": {"name_in_itself": "\u4e2d\u6587"},
        },
        prg_langs: {
            "c": {"version": "C", "name": "C"},
            "sql": {"version": "SQL", "name": "SQL"},
            "cpp": {"version": "C++", "name": "C++"},
        },

        show_survey: true,
        show_help: false,
        show_welcome: true,
        sequential: false,
        save_often: true,

        urls: {
            "status": "/chk/status/",
            "get_task": "/c/_get_task/",
            "submit_survey": "/surveys/_ajax_submit_candidate_survey/TICKET_ID/",
            "clock": "/chk/clock/",
            "close": "/c/close/TICKET_ID",
            "verify": "/chk/verify/",
            "save": "/chk/save/",
            "timeout_action": "/chk/timeout_action/",
            "final": "/chk/final/",
            "start_ticket": "/c/_start/"
        },
    };

    self.respondGetTask = function(data) {
        var task = data.task || self.current_task;
        var human_lang = data.human_lang;
        var prg_lang = data.prg_lang;
        var prefer_server_prg_lang = data.prefer_server_prg_lang;

        var t = self.tasks[task];
        if (prefer_server_prg_lang == 'true' && t.saved)
            prg_lang = t.saved.prg_lang;

        if (t.prg_lang_list.indexOf(prg_lang) == -1)
            prg_lang = t.prg_lang_list[0];
        if (t.human_lang_list.indexOf(human_lang) == -1)
            human_lang = t.human_lang_list[0];

        var id = task + ',' + human_lang + ',' + prg_lang;

        var solution = self.getTaskStart(task, human_lang, prg_lang);
        if (t.saved && t.saved.prg_lang == prg_lang)
            solution = t.saved.solution;

        return {
            'task_status': t.status,
            'task_description': 'Description: ' + id,
            'task_type': t.type,
            'solution_template': self.getTaskStart(task, human_lang, prg_lang),
            'current_solution': solution,
            'example_input': 'Example input: ' + id,
            'prg_lang_list': JSON.stringify(t.prg_lang_list),
            'human_lang_list': JSON.stringify(t.human_lang_list),
            'prg_lang': prg_lang,
            'human_lang': human_lang
        };
    };

    self.getTaskStart = function(task, human_lang, prg_lang) {
        return 'Start: ' + task + ',' + human_lang + ',' + prg_lang;
    };

    self.respondSave = function(data) {
        var task = data.task;
        var prg_lang = data.prg_lang;
        var solution = data.solution;

        self.tasks[task].saved = {
            'prg_lang': prg_lang,
            'solution': solution
        };
        self.tasks[task].n_saves = (self.tasks[task].n_saves || 0) + 1;

        return {
            'result': 'OK',
            'message': 'solution saved'
        };
    };

    self.respondTimeout = function(data) {
        var t = self.getRemainingTime();
        if (self.use_asserts)
            expect(t).toBeLessThan(60);
        self.timed_out = true;

        return self.respondSave(data);
    };

    self.respondSubmit = function(data, mode) {
        var task = data.task;
        var prg_lang = data.prg_lang;
        var solution = data.solution;

        var submit_id = self.submits.length;

        self.submits.push({
            'mode': mode,
            'task': task,
            'prg_lang': prg_lang,
            'solution': solution,
            'times_polled': 0
        });

        self.tasks[task].status = 'closed';

        return self.submitStatus(submit_id);
    };

    self.respondStatus = function(data) {
        var submit_id = data.id;
        var submit = self.submits[submit_id];
        submit.times_polled++;

        return self.submitStatus(submit_id);
    };

    self.submitStatus = function(submit_id) {
        var submit = self.submits[submit_id];
        var response;

        if (submit.result) {
            response = {
                'result': 'OK',
                'extra': submit.result
            };
        } else {
            response = {
                'result': 'LATER',
                'message': 'Request is waiting for evaluation.',
                'id': submit_id,
                'delay': 5
            };
        }
        if (submit.mode == 'final') {
            response.next_task = self.getNextTask();
        }

        return response;
    };

    // Useful for testing.
    self.getNextTask = function() {
        return self.next_task;
    };

    self.getRemainingTime = function() {
        return self.time_at_start - Math.floor(new Date().valueOf() / 1000);
    };

    self.ticket_submitted = false;
    self.respondClock = function(data) {
        if (self.ticket_submitted) {
            return {
                'result': 'ERROR',
                'message': 'Test is already closed.'
            };
        }
        return {
            'result': 'OK',
            'new_timelimit': self.getRemainingTime()
        };
    };

    self.respondStartTicket = function(data) {
        self._startCalled = true;
        if (self._startError){
            return {
                'error': "Could not start ticket"
            };
        }
        return {
            'started': 'OK'
        };
    };

    self.triggerStartError = function(){
        self._startError = true;
    };

    self.triggerTicketNotFound = function(){
        self._startTicketNotFound = true;
    };

    self.startCalled = function(){
        if(self._startCalled){
            return true;
        }
        return false;
    };

    self.respondTo = function(req) {
        if (req.url == '/logs/_multilog/') {
            // drop for now
            return;
        }

        if (req.aborted) {
            return;
        }

        if (req.url == '/surveys/_ajax_submit_candidate_survey/TICKET_ID/') {
            self.survey_submitted = true;
            req.respond(200, {}, '');
            return;
        }

        var data = getParams(req.requestBody);
        if (self.use_asserts) {
            expect(data.ticket).toBe('TICKET_ID');
            expect(req.method).toBe('POST');
        }
        var response;

        if (req.url == '/c/_get_task/') {
            response = self.respondGetTask(data);
        }
        if (req.url == '/c/_start/') {
            response = self.respondStartTicket(data);
            if (self._startTicketNotFound){
                return req.respond(404,
                    { "Content-Type": "text/xml" },
                    xmlResponse(response));
            }
        }
        if (req.url == '/chk/save/') {
            response = self.respondSave(data);
        }
        if (req.url == '/chk/verify/') {
            response = self.respondSubmit(data, 'verify');
        }
        if (req.url == '/chk/final/') {
            response = self.respondSubmit(data, 'final');
        }
        if (req.url == '/chk/status/') {
            response = self.respondStatus(data);
        }
        if (req.url == '/chk/clock/') {
            response = self.respondClock(data);
        }
        if (req.url == '/chk/timeout_action/') {
            response = self.respondTimeout(data);
        }
        console.debug(JSON.stringify(response, null, '\t'));
        req.respond(200, { "Content-Type": "text/xml" }, xmlResponse(response));
    };

    self.requests = [];
    /*
      Respond to all the requests, including the ones that happen immediately
      as a result of this method.
      If `timeout` is set, schedule the responses with appropriate delay
      (which should be mocked anyway).
    */
    self.respond = function(timeout) {
        while (self.requests.length > 0) {
            var request = self.requests.pop();
            if (timeout === undefined)
                self.respondTo(request);
            else
                setTimeout($.proxy(self.respondTo, self, request), timeout);
        }
    };

    self.init = function() {
        self.xhr = sinon.useFakeXMLHttpRequest();
        self.xhr.onCreate = function(request) {
            self.requests.push(request);
        };
    };

    self.shutdown = function() {
        self.xhr.restore();
    };

    self.verifyOkResponse = function() {
        return {
            'compile': {'ok': 1,
                        'message': 'compiler output'},
            'example': {'ok': 1,
                        'message': 'OK'}
        };
    };

    self.verifyFailedResponse = function() {
        return {
            'compile': {'ok': 1,
                        'message': 'compiler output'},
            'example': {'ok': 0,
                        'message': 'WRONG ANSWER'}
        };
    };

    function jsonToXml(data) {
        if (!(data instanceof Object))
            return data;
        function toXml(tag, content) {
            return '<'+tag+'>'+jsonToXml(content)+'</'+tag+'>';
        }
        var ret = '';
        $.each(data, function(tag, content) {
            ret += toXml(tag, content);
        });
        return ret;
    }

    function xmlResponse(data) {
        var ret = '<?xml version="1.0" encoding="UTF-8"?>';
        ret += '<response>';
        ret += jsonToXml(data);
        ret += '</response>';
        // ensure returned XML is valid
        jQuery.parseXML(ret);
        return ret;
    }

    return self;
}
