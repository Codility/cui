
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
        if (/^ *fail()/m.test(submit.solution)) {
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

    self.getTaskStart = function(id) {
        return ['// This is a starting solution for: ' + id,
                '',
                'int solution() {',
                '    // Delete or comment out the following line',
                '    // and the solution will pass verification.',
                '    fail();',
                '    return 42;',
                '}'].join('\n');
    };

    return self;
}
