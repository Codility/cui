
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
                'type': 'programming',
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
        show_help: true,
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
            "final": "/chk/final/"
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

        var solution = self.getTaskStart(id);
        if (t.saved && t.saved.prg_lang == prg_lang)
            solution = t.saved.solution;

        return {
            'task_status': t.status,
            'task_description': 'Description: ' + id,
            'task_type': t.type,
            'solution_template': self.getTaskStart(id),
            'current_solution': solution,
            'example_input': 'Example input: ' + id,
            'prg_lang_list': JSON.stringify(t.prg_lang_list),
            'human_lang_list': JSON.stringify(t.human_lang_list),
            'prg_lang': prg_lang,
            'human_lang': human_lang
        };
    };

    self.getTaskStart = function(id) { return 'Start: ' + id; };

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
        if (submit.mode == 'final')
            response.next_task = self.next_task;

        return response;
    };

    self.getRemainingTime = function() {
        return self.time_at_start - Math.floor(new Date().valueOf() / 1000);
    };

    self.respondClock = function(data) {
        return {
            'result': 'OK',
            'new_timelimit': self.getRemainingTime()
        };
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
