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


// Jasmine documentation:
// http://jasmine.github.io/2.0/introduction.html
// http://jasmine.github.io/2.0/ajax.html

// TODO consider customizing Jasmine's boot.js to our ends.
/* global describe,xdescribe,expect,jasmine,it,afterEach,beforeEach*/
/* global sinon*/
/* global console*/
/* global CandidateUi, Console, Clock, TestCases, Diff */
/* global AUTOSAVE_MAX_PERIOD */
/* global TestServer */
/* global InputData */


// is true if we're running a test
var TESTING;

// Don't complain under IE and such
if (!window.console) {
    window.console = {
        log: function() {},
        debug: function() {}
    };
}

function expectEnabled(selector, is_enabled) {
    expect($(selector).is(':enabled')).toBe(
        is_enabled,
        selector + ' should be ' + (is_enabled ? 'enabled' : 'disabled'));
}

function expectVisible(selector, is_visible) {
    expect($(selector).is(':visible')).toBe(
        is_visible,
        selector + ' should be ' + (is_visible ? 'visible' : 'invisible'));
}

function expectHasClass(selector, class_name, has_class) {
    expect($(selector).hasClass(class_name)).toBe(
        has_class,
        selector + (has_class ? ' should' : ' should not') + ' have class ' + class_name);
}

function expectAllSwitches(is_enabled) {
    expectEnabled('#current_human_lang', is_enabled);
    expectEnabled('#current_prg_lang', is_enabled);
    expectHasClass($('.task-list'), 'disabled', !is_enabled);
}

function clickTaskTab(name) {
    $('.task-list .task')
        .filter(function() { return $(this).data('name') === name; })
        .click();
}

function minutes(m, s) {
    s = s || 0;
    return 1000 * (m * 60 + s);
}

function seconds(s) {
    return 1000 * s;
}

var PAGE_HTML;


//used to test help button and initial help
function testHelp(clock) {
    // wait for help to show
    clock.tick(seconds(5));
    expectVisible('.introjs-overlay', true);
    expectVisible('.introjs-helperLayer', true);

    // click on overlay to hide it
    $('.introjs-overlay').click();
    clock.tick(seconds(1));
    expectVisible('.introjs-overlay', false);
    expectVisible('.introjs-helperLayer', false);
}

// Scaffolding for candidate UI
function describe_ui(suffix, extra_options, f) {
    describe('Candidate UI' + (suffix === "" ? "" : " " + suffix), function() {
        function FakeStorage () {
            var store = {};
            return {
                getItem: function(key) { return store[key]; },
                setItem: function(key, value) { return (store[key] = value + ''); },
                clear: function() { store = {}; }
            };
        }


        beforeEach(function() {
            TESTING = true;

            // Recover initial HTML. Done before, not after the test,
            // to observer effect of failures.
            if (PAGE_HTML === undefined)
                PAGE_HTML = $('#page').html();
            else
                $('#page').html(PAGE_HTML);

            // mock time (AJAX will be mocked by test server)
            this.clock = sinon.useFakeTimers();

            TestCases.storage = FakeStorage();

            this.server = TestServer();
            this.server.init();

            var my_ui_options = $.extend(true, {}, this.server.ui_options, extra_options);
            this.ui = window.ui = CandidateUi(my_ui_options);
            this.ui.init();

            this.exit_url = null;
            this.ui.exit = $.proxy(function(url) { this.exit_url = url; }, this);
        });

        afterEach(function() {
            this.ui.shutdown();
            this.clock.restore();
            this.server.shutdown();

            // remove the modal overlay for convenience
            $('.jqmOverlay').hide();

            TESTING = false;
        });

        f.apply(this);
    });
}

describe_ui('', {}, function() {
    var ui;
    var server, clock;

    beforeEach(function() {
        ui = this.ui;
        server = this.server;
        clock = this.clock;
    });

    it("should start", function() {});

    describe('task switching', function() {
        it("should load tasks", function() {
            server.respond();
            expect($('#task_description').html()).toBe('Description: task1,en,c');
            expect(ui.editor.getValue()).toBe('Start: task1,en,c');

            // Test that selects are populated correctly
            expectVisible('.task-list', true);
            expect($('.task-list .task').length).toBe(server.task_names.length);
            expect($('#current_prg_lang option').length).toBe(2);
            expect($('#current_human_lang option').length).toBe(2);
        });

        it('should switch human and programming languages', function() {
            server.respond();
            $('#current_human_lang').val('cn').change();
            expectAllSwitches(false);

            server.respond();
            expectAllSwitches(true);
            expect($('#task_description').html()).toBe('Description: task1,cn,c');
            expect(ui.editor.getValue()).toBe('Start: task1,cn,c');

            $('#current_prg_lang').val('cpp').change();
            expectAllSwitches(false);

            server.respond();
            expectAllSwitches(true);
            expect($('#task_description').html()).toBe('Description: task1,cn,cpp');
            expect(ui.editor.getValue()).toBe('Start: task1,cn,cpp');
        });

        it('should switch tasks', function() {
            server.respond();
            clickTaskTab('task2');
            expectAllSwitches(false);

            server.respond();
            expectAllSwitches(true);
            expect($('#task_description').html()).toBe('Description: task2,en,c');
            expect(ui.editor.getValue()).toBe('Start: task2,en,c');
        });

        function get_visible_options(sel) {
            // Hack: we're not able to use just :visible because Webkit
            // doesn't support this selector for options.
            return $.map($(sel).find('option'), function(elt) {
                var $elt = $(elt);
                if ($elt.css('display') == 'none')
                    return null;
                return $elt.val();
            });
        }

        it('should correctly display available human and programming languages', function() {
            server.respond();
            expect(get_visible_options('#current_human_lang')).toEqual(['en', 'cn']);
            expect(get_visible_options('#current_prg_lang')).toEqual(['c', 'cpp']);

            clickTaskTab('task3');
            server.respond();
            expect(get_visible_options('#current_human_lang')).toEqual(['en']);
            expect(get_visible_options('#current_prg_lang')).toEqual(['sql']);
        });

        it('should switch to last programming language when switching tasks', function() {
            server.respond();

            // let's say task2 was previously saved using C++
            server.tasks.task2.saved = {
                'solution': 'bla',
                'prg_lang': 'cpp',
            };
            clickTaskTab('task2');
            server.respond();

            // the UI should switch to C++
            expectAllSwitches(true);
            expect($('#task_description').html()).toBe('Description: task2,en,cpp');
            expect($('#current_prg_lang').val()).toBe('cpp');
        });

        it('should change languages to valid ones when switching tasks', function() {
            server.respond();
            $('#current_prg_lang').val('cpp').change();
            server.respond();
            $('#current_human_lang').val('cn').change();
            server.respond();
            expect($('#task_description').html()).toBe('Description: task1,cn,cpp');

            clickTaskTab('task3');
            server.respond();
            expect($('#task_description').html()).toBe('Description: task3,en,sql');
            expect($('#current_prg_lang').val()).toBe('sql');
            expect($('#current_human_lang').val()).toBe('en');
        });

        it('should save while switching tasks', function () {
            server.respond();
            ui.editor.setValue('just before switch');

            clickTaskTab('task2');
            server.respond();
            expect(ui.editor.getValue()).toBe('Start: task2,en,c');
            expect(server.tasks.task1.saved).toEqual({
                'prg_lang': 'c',
                'solution': 'just before switch'
            });
        });

        it('should switch to closed tasks', function() {
            server.tasks.task2.status = 'closed';

            server.respond();
            clickTaskTab('task2');
            server.respond();
            expectVisible('#msg_task_closed', true);
            expect($('#msg_task_closed').is(':visible')).toBe(true);
            $('#msg_task_closed [value=OK]').click();
            expectVisible('#msg_task_closed', false);

            expectEnabled('#current_human_lang', false);
            expectEnabled('#current_prg_lang', false);
            expectHasClass('.task-list', 'disabled', false);

            // Back to first task
            clickTaskTab('task1');
            server.respond();
            expectAllSwitches(true);
        });
        it('should correctly set noNewLines when switching tasks', function() {
            server.respond();

            clickTaskTab('task2');
            server.respond();
            expect(ui.editor.noNewLines).toBe(true);

            clickTaskTab('task3');
            server.respond();
            expect(ui.editor.noNewLines).toBe(false);

            clickTaskTab('task2');
            server.respond();
            expect(ui.editor.noNewLines).toBe(true);
        });
    });

    it('should show help', function() {
        $('#help_btn').click();
        testHelp(clock);

        //don't show dialog
        expectVisible('#exit_initial_help', false);
    });

    it('should update ui.task.modified', function() {
        server.respond();
        expect(ui.task.modified).toBe(false);

        ui.editor.setValue('my solution');
        expect(ui.task.modified).toBe(true);

        ui.saveAction();
        server.respond();
        expect(ui.task.modified).toBe(false);

        ui.editor.setValue('my solution 2');
        clickTaskTab('task2');
        server.respond();
        expect(ui.task.modified).toBe(false);
    });

    describe('save feature', function() {
        it('should save solutions', function() {
            server.respond();
            ui.editor.setValue('my solution');
            ui.saveAction();
            expectAllSwitches(false);

            server.respond();
            expectAllSwitches(true);
            expect(server.tasks.task1.saved).toEqual({
                'prg_lang': 'c',
                'solution': 'my solution'
            });
        });

        it('should not let auto-save overwrite data while switching tasks', function() {
            server.respond();
            ui.editor.setValue('my C solution');

            // The auto-save is handled with a delay...
            ui.saveActionAsync();
            server.respond(seconds(1));
            expect(server.tasks.task1.saved).toBe(null);

            // ...but before the server returns, we switch to other language
            $('#current_prg_lang').val('cpp').change();
            server.respond();
            expect(ui.editor.getValue()).toBe('Start: task1,en,cpp');

            // The solution is saved, but the UI shouldn't overwrite any data
            // about a task.
            clock.tick(seconds(1));
            expect(server.tasks.task1.saved).toEqual({
                'prg_lang': 'c',
                'solution': 'my C solution'
            });
            expect(ui.editor.getValue()).toBe('Start: task1,en,cpp');
            expect(ui.task.saved_solution).toBe('Start: task1,en,cpp');
            expect(ui.task.prg_lang).toEqual('cpp');
        });


        it('should save after each new modification', function() {
            server.respond();
            ui.editor.setValue('my solution 1');
            clock.tick(seconds(10));
            server.respond();
            expect(server.tasks.task1.saved.solution).toEqual('my solution 1');

            ui.editor.setValue('my solution 2');
            clock.tick(seconds(10));
            server.respond();
            expect(server.tasks.task1.saved.solution).toEqual('my solution 2');
        });

        it('shouldn\'t save too often', function() {
            server.respond();

            // Save only when we finished typing
            ui.editor.setValue('my solution 0');
            clock.tick(seconds(1));
            ui.editor.setValue('my solution 1');
            clock.tick(seconds(3));
            server.respond();
            expect(server.tasks.task1.n_saves).toEqual(1);
            expect(server.tasks.task1.saved.solution).toEqual('my solution 1');

            // Don't save twice in a short period of time
            ui.editor.setValue('my solution 2');
            clock.tick(seconds(3));
            server.respond();
            expect(server.tasks.task1.n_saves).toEqual(1);
            expect(server.tasks.task1.saved.solution).toEqual('my solution 1');
        });

        it('shouldn\'t save too rarely while candidate is editing', function() {
            server.respond();
            ui.editor.setValue('my solution');
            clock.tick(seconds(3));
            server.respond();
            expect(server.tasks.task1.saved.solution).toEqual('my solution');

            // Edit too frequently for 'save after typing' to kick in
            var n_edits = AUTOSAVE_MAX_PERIOD/1000;
            for (var i = 0; i < n_edits; i++) {
                ui.editor.setValue('my solution ' + i);
                clock.tick(seconds(1));
                server.respond();
            }
            expect(server.tasks.task1.n_saves).toEqual(2);
            expect(server.tasks.task1.saved.solution).toEqual('my solution ' + (n_edits-1));
        });
    });

    it('should verify solutions', function() {
        server.respond();
        ui.editor.setValue('my solution 1');
        $('#verify_button').click();
        expectAllSwitches(false);

        // server accepts the submit, but doesn't return result yet
        server.respond();
        expectAllSwitches(false);
        expect($('#console').text()).toMatch('Running solution');

        // there's a submit
        expect(server.submits.length).toBe(1);
        expect(server.submits[0].mode).toBe('verify');
        expect(server.submits[0].task).toBe('task1');
        expect(server.submits[0].prg_lang).toBe('c');
        expect(server.submits[0].solution).toBe('my solution 1');

        // UI polls for evaluation in [1s, 2s, 3s, 4s...] intervals
        var N_ATTEMPTS = 5;
        for (var attempt = 0; attempt < N_ATTEMPTS; attempt++) {
            clock.tick(seconds(attempt + 1));
            server.respond();
            expectAllSwitches(false);
            expect(server.submits[0].times_polled).toBe(attempt+1);
        }

        // the submit is evaluated
        server.submits[0].result = server.verifyOkResponse();
        clock.tick(seconds(N_ATTEMPTS + 1));
        server.respond();
        expectAllSwitches(true);
        expect($('#console').text()).toMatch('Verification succeeded');
    });

    describe('final task submission', function() {
        function beginFinal() {
            server.respond();
            ui.editor.setValue('my solution 1');
            $('#final_button').click();

            // 'are you sure?'
            expectVisible('#final_prompt', true);
            $('#final_prompt .yes').click();
            expectVisible('#final_prompt', false);

            // 'Codility is verifying your solution'
            expectVisible('#final_verification', true);
            expectAllSwitches(false);

            // there's a verify submit
            server.respond();
            expect(server.submits.length).toBe(1);
        }

        function finalVerifySuccess() {
            server.submits[0].result = server.verifyOkResponse();
            clock.tick(seconds(1));
            server.respond();

            expectVisible('#final_verification', true);
            expect($('#final_verification').text()).toMatch('solution verification -- OK');
        }

        function closeTaskCompletedMsg() {
            // Wait 0.5s and then hide the message
            // 'Task has been received. Now you can solve next task.'

            clock.tick(500);
            expectVisible('#final_verification', false);
            expectVisible('#msg_task_completed', true);
            $('#msg_task_completed [value="Next task"]').click();
            expectVisible('#msg_task_completed', false);

            expectAllSwitches(false);
            server.respond();
            expectAllSwitches(true);
        }

        function endFinal() {
            // submit happens after 1s
            clock.tick(seconds(1));

            server.next_task = 'task2';
            // there's a final submit
            server.respond();
            expect(server.submits.length).toBe(2);
            expect(server.submits[1].mode).toBe('final');
            expect(server.submits[1].task).toBe('task1');
            expect(server.submits[1].prg_lang).toBe('c');
            expect(server.submits[1].solution).toBe('my solution 1');

            closeTaskCompletedMsg();
            // we should be on the second task now
            expect($('#task_description').html()).toBe('Description: task2,en,c');
            expect(ui.editor.getValue()).toBe('Start: task2,en,c');
        }

        it('should work', function() {
            beginFinal();
            finalVerifySuccess();
            endFinal();
        });

        it('should work when verify failed', function() {
            beginFinal();

            server.submits[0].result = server.verifyFailedResponse();
            clock.tick(seconds(1));
            server.respond();

            // your solution is not correct, do you still want to submit?
            expectVisible('#final_verification', true);
            expect($('#final_verification').text()).toMatch('Your solution is not correct');
            $('#final_verification .yes').click();

            endFinal();
        });

        it('should work when auto-save happens during verify', function() {
            server.respond();
            ui.editor.setValue('my solution 1');
            $('#final_button').click();

            // 'are you sure?'
            expectVisible('#final_prompt', true);

            // at the same time, auto-save kicks in...
            ui.saveActionAsync();

            // and we initiate verification
            $('#final_prompt .yes').click();
            expectVisible('#final_prompt', false);
            server.respond();
            expect(server.submits.length).toBe(1);

            finalVerifySuccess();
            endFinal();
        });

        it('should work when auto-save happens during final', function() {
            beginFinal();
            finalVerifySuccess();
            // after verifying, auto-save kicks in...
            ui.saveActionAsync();
            // and then submit happens
            endFinal();
        });

        it('should block timeout action when we\'re saving', function() {
            // test Trac #2714
            beginFinal();
            finalVerifySuccess();
            server.respond();
            // submit happens after 1s
            Clock.clockAction();
            clock.tick(seconds(1));
            server.next_task = '';
            server.ticket_submitted = true;
            expect(Clock.timeout_temp_disabled).toBe(true);
            clock.tick(seconds(1));
            server.respond();
            expectVisible('#msg_timeout', false);
        });

        it('should block timeout action when we\'re on the last task', function() {
            beginFinal();
            finalVerifySuccess();

            clock.tick(seconds(1));
            server.next_task = '';
            server.respond();
            clock.tick(500);
            expectVisible('#msg_final_task_completed', true);

            clock.tick(minutes(31));
            server.respond();
            expect(server.timed_out).toBe(false);
        });

        it('should switch to previous programming language afterwards', function() {
            // test Trac #2267
            server.respond();
            $('#current_prg_lang').val('cpp').change();
            expectAllSwitches(false);
            server.respond();
            expectAllSwitches(true);
            ui.editor.setValue('my solution in cpp');

            clickTaskTab('task2');
            server.respond();

            expect($('#current_prg_lang').val()).toBe('cpp');
            expect($('#task_description').html()).toBe('Description: task2,en,cpp');

            $('#current_prg_lang').val('c').change();

            beginFinal();
            finalVerifySuccess();

            // submit happens after 1s
            clock.tick(seconds(1));

            server.next_task = 'task1';
            // there's a final submit
            server.respond();
            expect(server.submits.length).toBe(2);
            expect(server.submits[1].mode).toBe('final');
            expect(server.submits[1].task).toBe('task2');
            expect(server.submits[1].prg_lang).toBe('c');
            expect(server.submits[1].solution).toBe('my solution 1');

            closeTaskCompletedMsg();
            expect($('#task_description').html()).toBe('Description: task1,en,cpp');
            expect(ui.editor.getValue()).toBe('my solution in cpp');
        });
    });

    describe('survey form', function() {
        it('should appear with final-task popup', function() {
            expectVisible('#survey', false);
            $('#msg_final_task_completed').jqmShow();
            expectVisible('#survey', true);
        });

        it('should appear with timeout popup', function() {
            expectVisible('#survey', false);
            $('#msg_timeout').jqmShow();
            expectVisible('#survey', true);
        });

        it('should expand on "continue survey"', function() {
            $('#msg_timeout').jqmShow();
            expectVisible('#survey input[name=answer2]', false);
            $('#survey_continue_button').click();
            expectVisible('#survey input[name=answer2]', true);
        });

        describe('(after being shown)', function() {
            beforeEach(function() {
                $('#msg_timeout').jqmShow();
                $('#survey_continue_button').click();
            });

            // see #2507 - actually, it submitted even when the form wasn't shown
            it('shouldn\'t submit when nothing is filled in', function() {
                $('#msg_timeout').jqmHide();
                server.respond();
                expect(server.survey_submitted).toBe(false);
            });

            it('should submit when a numerical question is answered', function() {
                $('[name=answer1][value=1]').click();
                $('#msg_timeout').jqmHide();
                server.respond();
                expect(this.server.survey_submitted).toBe(true);
            });

            it('should submit when a text question is answered', function() {
                $('[name=answer3]').val('Bla bla bla');
                $('#msg_timeout').jqmHide();
                server.respond();
                expect(this.server.survey_submitted).toBe(true);
            });

            // TODO assert that the answers content reached the server
        });
    });

    describe('test cases widget', function () {
        function addTestCase(value) {
            expectVisible('#add_test_case', true);
            $('#add_test_case').click();

            if (value) {
                $('.test-case input').last().val(value);
            }
        }

        function removeTestCase() {
            $('.test-case .remove').first().click();
        }

        it('should add test cases', function() {
            server.respond();
            expect($('.test-case').length).toBe(0);
            addTestCase();
            expect($('.test-case').length).toBe(1);
            expect($('.test-case input').val()).toBe('');
        });

        it('should remove test cases', function() {
            server.respond();
            addTestCase();
            addTestCase();
            expect($('.test-case').length).toBe(2);
            removeTestCase();
            expect($('.test-case').length).toBe(1);
        });

        it('should have a limit on number', function() {
            server.respond();
            for (var i = 0; i < TestCases.limit; i++) {
                addTestCase();
                expect($('.test-case').length).toBe(i+1);
            }
            expectVisible('#test_case_link', false);
        });

        it('should remember test cases between tasks', function() {
            server.respond();
            addTestCase('foo');
            addTestCase();
            expect($('.test-case').length).toBe(2);

            clickTaskTab('task2');
            server.respond();
            addTestCase();
            expect($('.test-case').length).toBe(1);

            clickTaskTab('task1');
            server.respond();
            expect($('.test-case').length).toBe(2);
            expect($('.test-case input').first().val()).toBe('foo');
        });


        it('should submit non-empty test cases for verification', function() {
            server.respond();
            addTestCase('test case 1');
            addTestCase();
            addTestCase('test case 2');

            $('#verify_button').click();
            server.respond();

            expect(server.submits.length).toBe(1);
            expect(server.submits[0].mode).toBe('verify');
            expect(server.submits[0].test_data1).toBe('test case 1');
            expect(server.submits[0].test_data2).toBe('test case 2');
        });

        it('should switch programming language without enabling disabled add test case button', function() {
            server.respond();
            for (var i = 0; i < TestCases.limit; i++) {
                addTestCase();
                expect($('.test-case').length).toBe(i+1);
            }
            expectVisible('#test_case_link', false);
            //switch task
            $('#current_prg_lang').val('cpp').change();
            expectAllSwitches(false);

            server.respond();
            expectAllSwitches(true);
            //test button is still hidden
            expectVisible('#test_case_link', false);
        });

        it('should replace Unicode minus with a normal one', function() {
            server.respond();
            addTestCase();
            $('.test-case input').val('\u2212'+'42');
            $('#verify_button').click();
            expect($('.test-case input').val()).toBe('-42');
        });

        it('should remove Unicode characters', function() {
            server.respond();
            addTestCase();
            $('.test-case input').val('bździągwa');
            $('#verify_button').click();
            expect($('.test-case input').val()).toBe('bdzigwa');
        });

        it('should not be visible for SQL tasks', function() {
            server.respond();
            expectVisible('#test_cases_area', true);
            clickTaskTab('task3');
            server.respond();
            expectVisible('#test_cases_area', false);
        });

        it('should not be visible while switching', function() {
            server.respond();
            expectVisible('#test_cases_area', true);
            clickTaskTab('task2');
            expectVisible('#test_cases_area', false);
            server.respond();
            expectVisible('#test_cases_area', true);
        });

        it('should be hidden before the task is loaded', function() {
            expectVisible('#test_cases_area', false);
            server.respond();
            expectVisible('#test_cases_area', true);
        });
    });

    describe('reset button', function() {
        it('should be visible for bugfixing tasks only', function() {
            server.respond();
            expectVisible('#reset_btn', false);

            clickTaskTab('task2');
            server.respond();
            expectVisible('#reset_btn', true);

            clickTaskTab('task3');
            server.respond();
            expectVisible('#reset_btn', false);
        });

        it('should reset the code to solution template', function() {
            server.respond();

            clickTaskTab('task2');
            server.respond();

            ui.editor.setValue('modified code');
            $('#reset_btn').click();
            server.respond();
            expect(ui.editor.getValue()).toBe('Start: task2,en,c');
            expect(server.tasks.task2.saved).toEqual({
                prg_lang: 'c',
                solution: 'modified code'
            });

            // try the same for another language
            $('#current_prg_lang').val('cpp').change();
            server.respond();

            ui.editor.setValue('modified code');
            $('#reset_btn').click();
            server.respond();
            expect(ui.editor.getValue()).toBe('Start: task2,en,cpp');
        });
    });

    describe('diff highlighting for bugfixing tasks', function() {
        // Ace refuses to render all changes immediately
        function renderChanges() {
            ui.editor.ace.renderer.updateFull(true);
        }

        it('should work after editing', function() {
            server.respond();

            clickTaskTab('task2');
            server.respond();
            ui.editor.setValue('modified');
            renderChanges();
            expect($('.ace .highlight-changed-line').length).toBe(1);
        });

        it('should work after reloading the solution', function() {
            server.respond();
            clickTaskTab('task2');
            server.respond();
            ui.editor.setValue('modified');

            clickTaskTab('task1');
            server.respond();
            clickTaskTab('task2');
            server.respond();
            renderChanges();
            expect($('.ace .highlight-changed-line').length).toBe(1);
        });
    });

    describe('clock widget', function() {
        it('should count down', function() {
            server.respond();

            expect(ui.options.time_remaining_sec).toBe(60 * 30);
            expect($('#clock').text()).toBe('00:30:00');
            clock.tick(minutes(15, 12));
            expect($('#clock').text()).toBe('00:14:48');
        });

        it('should ask server for time', function() {
            expect(Clock.CLOCK_REFRESH_TIME, 2*60*1000);

            server.respond();
            expect(Clock.time_to_end).toBe(60 * 30);

            server.time_at_start = 60 * 29;
            clock.tick(Clock.CLOCK_REFRESH_TIME);
            server.respond();
            expect(Clock.time_to_end).toBe(60 * 27);

            server.time_at_start = 60 * 31;
            clock.tick(Clock.CLOCK_REFRESH_TIME);
            server.respond();
            expect(Clock.time_to_end).toBe(60 * 27);
        });

        it('should show timeout warning', function() {
            server.respond();
            // The clock shows warning around 3, 2 and 1-minute mark.

            clock.tick(minutes(27));

            for (var i = 0; i < 3; i++) {
                expect(Clock.timeout_warning_active).toBe(true);
                clock.tick(seconds(30));
                expect(Clock.timeout_warning_active).toBe(false);
                clock.tick(seconds(30));
            }
        });

        it('should time out the ticket and notify the server', function() {
            server.respond();
            clock.tick(minutes(29, 59));
            ui.editor.setValue('last minute solution');
            clock.tick(seconds(2));
            server.respond();
            expectVisible('#msg_timeout', true);
            expect(server.timed_out).toBe(true);
            // Actually, both save and timeout_action submit the solution here...
            expect(server.tasks.task1.saved).toEqual({
                'prg_lang': 'c',
                'solution': 'last minute solution'
            });
            // the clock should stop ticking
            clock.tick(seconds(10));
            expect($('#clock').text()).toBe('00:00:00');
        });
    });

    describe("copy restriction", function(){
        var buildSelection = function(startNode, endNode){
            var selRange = document.createRange();
            selRange.setStart(startNode, 0);
            if (!endNode){
                selRange.setEnd(startNode, startNode.childNodes.length);
            }
            else{
                selRange.setEndAfter(endNode, endNode.childNodes.length);
            }
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(selRange);

        };
        it('should allow copying in console', function(){
            server.respond();
            Console.msg("Hello, world");
            Console.msg_error("This is an error");
            Console.msg_syserr("This is a system error");
            Console.msg_ok("This is not an error");
            //allow copy of the whole console range
            var c_console = $('#console')[0];
            buildSelection(c_console);
            expect(ui.selectionRestrictedToConsole()).toBe(true);
            //allow copy of a sub element in console
            var sub_element = c_console.childNodes[4];
            buildSelection(sub_element);
            expect(ui.selectionRestrictedToConsole()).toBe(true);
            //alow copy of overlapping elements within console
            var sub_element2 = c_console.childNodes[6];
            buildSelection(sub_element, sub_element2);
            expect(window.getSelection().getRangeAt(0).commonAncestorContainer.id).toBe('console');
            expect(ui.selectionRestrictedToConsole()).toBe(true);
        });
        it('should not allow copying when overlapping with restricted portions',function(){
            server.respond();
            //don't allow copy when console and another is highlighted
            var c_console = $('#console')[0];
            var editor_bar = $('#editor_bar')[0];
            var e = {'target': editor_bar}; //target is usually first node in the selection
            buildSelection(editor_bar, c_console);
            expect(ui.selectionRestrictedToConsole()).toBe(false);
            expect(ui.validCopySelection(e)).toBe(false);
            //don't allow copy within task description
            var task_description = $('#task_description')[0];
            buildSelection(task_description);
            e.target = task_description;
            expect(ui.selectionRestrictedToConsole()).toBe(false);
            expect(ui.validCopySelection(e)).toBe(false);
        });
        it('should allow copying of example data from task description', function(){
            server.respond();
            var task_description = $('#task_description');
            task_description.append("<div>Some random descripton text</div>");
            task_description.append("<tt>This contains example data</tt>");
            var example_node = $('#task_description tt')[0];
            var e = {'target': example_node};
            buildSelection(example_node);
            expect(ui.selectionRestrictedToConsole()).toBe(false);
            expect(ui.validCopySelection(e)).toBe(true);
        });

    });

    /*
      This test is intended to guard us against changes in Ace
      breaking copy-paste detection and possibly even copy-pasting.

      The test is disabled in browsers other than Firefox, because
      we are not able to construct an appropriate CustomEvent in make_event.
    */
    var firefox_describe =  $.browser.mozilla ? describe : xdescribe;

    firefox_describe('copy-paste detection', function() {
        function make_event(type, text) {
            var e = new CustomEvent(type);
            e.clipboardData = { getData: function() { return text; }, setData: function() {} };
            return e;
        }

        function trigger(e) {
            $('.ace_text-input')[0].dispatchEvent(e);
        }

        function copy_all() {
            ui.editor.ace.selectAll();
            trigger(make_event('copy', ui.editor.getValue()));
        }

        function cut_all() {
            ui.editor.ace.selectAll();
            trigger(make_event('cut', ui.editor.getValue()));
            ui.editor.setValue('');
        }

        function paste(text) {
            trigger(make_event('paste', text));
            // reporting the paste is deferred by 100 ms
            clock.tick(100);
        }

        var short_text = 'foo';
        var long_text = 'foo\nbar';
        var long_text_crlf = 'foo\r\nbar';

        it('should register pastes longer than one line', function() {
            server.respond();

            ui.editor.setValue('');
            paste(short_text);
            expect(ui.pastes_detected).toEqual(0);
            expect(ui.editor.getValue()).toEqual(short_text);

            paste(long_text);
            expect(ui.pastes_detected).toEqual(1);
            expect(ui.editor.getValue()).toEqual(short_text+long_text);
        });

        it("shouldn't register cuts or pastes from inside editor", function() {
            server.respond();

            ui.editor.setValue(long_text);
            copy_all();
            ui.editor.ace.clearSelection();
            paste(long_text);
            expect(ui.pastes_detected).toEqual(0);
            expect(ui.editor.getValue()).toEqual(long_text+long_text);

            ui.editor.setValue(long_text);
            cut_all();
            paste(long_text);
            expect(ui.pastes_detected).toEqual(0);
            expect(ui.editor.getValue()).toEqual(long_text);
        });

        it("should handle Windows-style text (CRLF)", function() {
            server.respond();

            ui.editor.setValue(long_text);
            cut_all();
            paste(long_text_crlf);
            expect(ui.pastes_detected).toEqual(0);
        });
    });
});


describe_ui("start ticket", {}, function(){
    var ui;
    var server, clock;

    beforeEach(function() {
        ui = this.ui;
        server = this.server;
        clock = this.clock;
        expect(server.startCalled()).toBe(false);
    });

    it('should be called', function(){
        //start ticket
        server.respond();
        expect(server.startCalled()).toBe(true);
    });

    it('should respond properly to errors', function(){
        //simulate error condition
        server.triggerStartError();
        server.respond();

        expect($('#ticket_start_error .error-message').text()).toMatch('Could not start ticket');

    });

    it('should respond properly to invalid tickets', function(){
        //simulate error condition
        server.triggerTicketNotFound();
        server.respond();
        expect($('#console').text()).toMatch("Network error encountered while trying to start your test. "+
            "Try reloading this page.");

    });
});

describe_ui('(with show_help enabled)', { 'show_help': true }, function(){
    var ui;
    var server, clock;

    beforeEach(function() {
        ui = this.ui;
        server = this.server;
        clock = this.clock;
    });

    afterEach(function() {
        $('.introjs-overlay').click();
        clock.tick(seconds(1));
        $('#exit_intro_yes').click();
    });

    it('should show initial help', function(){
        // help is shown initially, after a delay
        server.respond();
        clock.tick(seconds(1));
        testHelp(clock);
    });

    it('should not count down time while in help', function(){
        server.respond();
        clock.tick(seconds(1));
        var firsttime = $("#clock").text();
        clock.tick(seconds(20));
        var secondtime = $("#clock").text();
        expect(secondtime).toBe(firsttime);
    });

    it('should bring up dialog upon exit', function(){
        server.respond();
        clock.tick(seconds(1));
        $('.introjs-overlay').click();
        expectVisible("#exit_initial_help", true);
    });

    it("should return to help if 'no' is selected on dialog", function(){
        server.respond();
        clock.tick(seconds(1));
        $('.introjs-overlay').click();
        expectVisible("#exit_initial_help", true);
        $("#exit_intro_no").click();
        clock.tick(seconds(1));
        expectVisible('.introjs-overlay', true);
        expectVisible('.introjs-helperLayer', true);

    });

    it("should exit intro and call start ticket if 'yes' is selected on dialog", function(){
        server.respond();
        clock.tick(seconds(1));
        $('.introjs-overlay').click();
        expectVisible("#exit_initial_help", true);
        $("#exit_intro_yes").click();
        clock.tick(seconds(1));
        expectVisible('.introjs-overlay', false);
        expectVisible('.introjs-helperLayer', false);
        server.respond();
        expect(server.startCalled()).toBe(true);
    });
});

describe('diff engine', function() {
    it('should split string into lines, disregarding some whitespace runs', function() {
        expect(Diff.splitLines('foo\nbar\nbaz')).toEqual(['foo', 'bar', 'baz']);
        expect(Diff.splitLines('')).toEqual([]);
        expect(Diff.splitLines('2 +   2 ')).toEqual(['2 + 2']);
        expect(Diff.splitLines('line   1 \n line 2 \n')).toEqual(['line 1', ' line 2', '']);
    });

    it('should diff tokens', function() {
        expect(Diff.findChanges('', 'abc')).toBe('+++');
        expect(Diff.findChanges('abc', '')).toBe('---');
        expect(Diff.findChanges('abc', 'def')).toBe('---+++');
        expect(Diff.findChanges('abc', 'abc')).toBe('000');
        expect(Diff.findChanges('fooxyzbar', 'fooXYZbar')).toBe('000---+++000');
        expect(Diff.findChanges('abc', 'AbC')).toBe('-+0-+');
        // issue found by KG - diff should bring changes next to each other
        expect(Diff.findChanges('aa', 'ba')).toBe('-+0');
        expect(Diff.findChanges('ba', 'aa')).toBe('-+0');
        // catches wrong approach to fixing the algorithm
        expect(Diff.findChanges('abc', 'XbY')).toBe('-+0-+');
    });

    it('should analyze solutions', function() {
        function sol(s) { return s.split('').join('\n'); }

        expect(Diff.analyze(sol('xyzw'), sol('xw'))).toEqual(
            { nChanged: 2, highlightChanged: [], highlightRemoved: [1] });

        expect(Diff.analyze(sol('xw'), sol('xyzw'))).toEqual(
            { nChanged: 2, highlightChanged: [1, 2], highlightRemoved: [] });

        expect(Diff.analyze(sol('xyyyw'), sol('xzzw'))).toEqual(
            { nChanged: 3, highlightChanged: [1, 2], highlightRemoved: [] });

        // Don't count empty lines (here ' ' serves as an empty line)
        expect(Diff.analyze(sol('xy zw'), sol('xyzw'))).toEqual(
            { nChanged: 0, highlightChanged: [], highlightRemoved: [] });

        expect(Diff.analyze(sol('xyzw'), sol('xy zw'))).toEqual(
            { nChanged: 0, highlightChanged: [], highlightRemoved: [] });
    });
});

describe('plugins', function () {
    function Plugin() {
        var self = {};

        self.load = function (ui) {};

        self.unload = function () {};

        return self;
    }

    function FailingPlugin() {
        var self = Plugin();

        self.unload = function () {
            throw new Error("woo, error");
        };

        return self;
    }


    describe_ui('plugins loading and unloading', {}, function() {
        it('should load and unload plugin', function () {
            // setup spys
            var plugin = Plugin();
            sinon.spy(plugin, 'load');
            sinon.spy(plugin, 'unload');

            // load plugin
            this.ui.addPlugin(plugin);
            console.log(plugin);
            expect(plugin.load.callCount).toBe(1);
            expect(plugin.unload.callCount).toBe(0);

            // unload plugin
            this.ui.removePlugin(plugin);
            expect(plugin.unload.callCount).toBe(1);
        });

        it('should throw exceptions if trying to do something illegal', function () {
            // setup plugin
            var plugin = Plugin();

            // setup spys
            sinon.spy(this.ui, "addPlugin");
            sinon.spy(this.ui, "removePlugin");

            // test behaviour
            this.ui.addPlugin(plugin);
            expect(this.ui.addPlugin.threw()).toBe(false);

            try {
                this.ui.addPlugin(plugin);
            } catch (e) {
                // ignore
            }
            expect(this.ui.addPlugin.threw()).toBe(true);

            this.ui.removePlugin(plugin);
            expect(this.ui.removePlugin.threw()).toBe(false);

            try {
                this.ui.removePlugin(plugin);
            } catch (e) {
                // ignore
            }
            expect(this.ui.removePlugin.threw()).toBe(true);
        });

        describe('removePlugins', function () {
            it('should automaticly unload plugin when shutting down', function () {
                // setup spys
                var plugin = Plugin();
                sinon.spy(plugin, 'unload');

                // load plugin
                this.ui.addPlugin(plugin);

                // check unloading
                expect(plugin.unload.callCount).toBe(0);
                this.ui.shutdown();
                expect(plugin.unload.callCount).toBe(1);
            });

            it('should remove all loaded plugins', function () {
                var that = this;

                // make a few plugins
                var plugins = new Array(10).join().split('').map(FailingPlugin);

                // setup spys
                plugins.forEach(function (plugin) {
                    sinon.spy(plugin, "unload");
                });

                // load plugins
                plugins.forEach(this.ui.addPlugin);

                // remove all of them
                that.ui.removePlugins();

                // check if everyone was unloaded
                expect(plugins.every(function (plugin) {
                    return plugin.unload.calledOnce;
                })).toBe(true);
            });
        });
    });
});

describe('input data module', function() {
    it('should tokenize strings', function() {
        function token_values(tokens) {
            return $.map(tokens, function(token) { return token.value; });
        }

        expect(token_values(InputData.tokenize(''))).toEqual([]);
        expect(token_values(InputData.tokenize('  '))).toEqual([]);
        expect(token_values(InputData.tokenize(' (1, None, -2, 3) '))).toEqual(['(', 1, ',', 'None', ',', -2, ',', 3, ')']);
        expect(function() { InputData.tokenize(' 1.5 '); }).toThrowError();
    });

    var example_tree_string = '(25, (19, (12, (4, None, None), None), (22, None, (23, None, None))), (37, (29, None, (30, None, None)), None))';
    var example_tree = {
        l: { l: { l: { l: { empty: true }, val: 4, r: { empty: true } },
                  val: 12,
                  r: { empty: true } },
             val: 19,
             r: { l: { empty: true },
                  val: 22,
                  r: { l: { empty: true }, val: 23, r: { empty: true } } } },
        val: 25,
        r: { l: { l: { empty: true },
                  val: 29,
                  r: { l: { empty: true }, val: 30, r: { empty: true } } },
             val: 37,
             r: { empty: true } } };

    it('should parse trees', function() {
        expect(InputData.parse_tree('')).toEqual({ empty: true });
        expect(InputData.parse_tree('None')).toEqual({ empty: true });
        expect(InputData.parse_tree('(-1, None, None)')).toEqual({val: -1, l: { empty: true }, r: { empty: true }});
        expect(InputData.parse_tree(example_tree_string)).toEqual(example_tree);
        // TODO check for error messages
    });

    it('should parse tuples', function() {
        var format = [{name: 'A', type: 'int'}, {name: 'B', type: 'int'}, {name: 'T', type: 'tree'}];
        expect(InputData.parse_tuple('(1, 2, (3, None, None))', format)).toEqual(
            {A: 1, B: 2, T: { l: { empty: true }, val: 3, r: { empty: true }}}
        );
        expect(InputData.parse_tuple('(42, 44, ' + example_tree_string + ')', format)).toEqual(
            {A: 42, B: 44, T: example_tree});
        expect(function() { InputData.parse_tuple('(3, None, None)', format); }).toThrowError();

        expect(InputData.parse_tuple('3', [{name: 'A', type: 'int'}])).toEqual({A: 3});
        expect(InputData.parse_tuple('(1, None, None)', [{name: 'A', type: 'tree'}])).toEqual(
            {A: {val: 1, l: { empty: true}, r: { empty: true }}});
    });

    it('should serialize trees', function() {
        expect(InputData.serialize_tree({ empty: true })).toEqual('None');
        expect(InputData.serialize_tree({ val: -1, l: { empty: true }, r: { empty: true } })).toEqual('(-1, None, None)');
        expect(InputData.serialize_tree(example_tree)).toEqual(example_tree_string);
    });

    it('should serialize tuples', function() {
        var format = [{name: 'A', type: 'int'}, {name: 'B', type: 'int'}, {name: 'T', type: 'tree'}];
        expect(InputData.serialize_tuple({ A: 4, B: 10, T: example_tree}, format)).toEqual('(4, 10, ' + example_tree_string + ')');
        var format2 = [{name: 'X', type: 'int'}, {name: 'T', type: 'tree'}];
        expect(InputData.serialize_tuple({ X: 4, T: { empty: true }}, format2)).toEqual('(4, None)');

        expect(InputData.serialize_tuple({A: 3}, [{name: 'A', type: 'int'}])).toEqual('3');

        expect(InputData.serialize_tuple({A: {val: 1, l: { empty: true}, r: { empty: true }}},
            [{name: 'A', type: 'tree'}])).toEqual(
            '(1, None, None)');
    });
});

describe_ui('tree editor', {}, function() {
    var server;

    function get_tree(path) {
        var tree = $('#tree_editor .root');
        for (var i = 0; i < path.length; ++i) {
            if (path[i] == 'l')
                tree = tree.find('> .children > .left');
            else
                tree = tree.find('> .children > .right');
        }
        return tree;
    }

    function get_tree_node(path) {
        return get_tree(path).find('> .node');
    }

    function get_tree_empty_node(path) {
        return get_tree(path).find('> .empty');
    }

    function get_tree_val(path) {
        return get_tree(path).find('> .node > text').text();
    }

    function get_tree_edge(path) {
        return get_tree(path).find('> .edge');
    }

    var INPUT_SELECTOR = '#tree_editor .edit input';
    var BUTTON_OK_SELECTOR = '#tree_editor .ok';
    var BUTTON_CANCEL_SELECTOR = '#tree_editor .cancel';
    var BUTTON_UNDO_SELECTOR = '#tree_editor .undo';

    function check_node_count(count) {
        expect($('#tree_editor text').length).toEqual(count);
        expect($('#tree_editor .empty').length).toEqual(count + 1);
    }

    function check_undo_enabled(is_enabled) {
        expectEnabled(BUTTON_UNDO_SELECTOR, is_enabled);
    }

    function perform_undo() {
        expectEnabled(BUTTON_UNDO_SELECTOR, true);
        $(BUTTON_UNDO_SELECTOR).click();
    }

    function set_value(value) {
        $(INPUT_SELECTOR).val(value).trigger('blur-test');
    }

    function select_task(task_name) {
        clickTaskTab(task_name);
        server.respond();
    }

    beforeEach(function() {
        server = this.server;
        server.respond();
    });


    describe('(normal)', function() {
        beforeEach(function() {
            select_task('task4');
        });

        it("should open tree editor when allowed", function() {
            clickTaskTab('task1');
            server.respond();
            $('#add_test_case').click();
            expectVisible('#tree_editor', false);
            expectVisible('#test_cases .test-case .edit', false);
            clickTaskTab('task4');
            server.respond();
            $('#add_test_case').click();
            expectVisible('#tree_editor', true);
            expectVisible('#test_cases .test-case .edit', true);
        });

        it("should render tree", function() {
            $('#add_test_case').click();
            expect(get_tree_val('')).toEqual('25');
            expect(get_tree_val('rlr')).toEqual('30');
            check_node_count(9);
            check_undo_enabled(false);
            expectVisible(INPUT_SELECTOR, false);
        });

        it("should edit node value", function() {
            $('#add_test_case').click();
            get_tree_node('rlr').click();
            expectVisible(INPUT_SELECTOR, true);
            set_value('45');
            expectVisible(INPUT_SELECTOR, false);
            expect(get_tree_val('rlr')).toEqual('45');

            perform_undo();
            expect(get_tree_val('rlr')).toEqual('30');
            check_undo_enabled(false);
        });

        it("should add node", function() {
            $('#add_test_case').click();
            get_tree_empty_node('rlrl').click();
            expect(get_tree_val('rlrl')).toEqual('0');
            check_node_count(10);
            expectVisible(INPUT_SELECTOR, true);
            set_value('45');
            expectVisible(INPUT_SELECTOR, false);
            expect(get_tree_val('rlrl')).toEqual('45');

            perform_undo();
            expect(get_tree_val('rlrl')).toEqual('0');
            perform_undo();
            check_node_count(9);
            check_undo_enabled(false);
        });

        it("should remove nodes", function() {
            $('#add_test_case').click();
            get_tree_edge('rlr').click();
            check_node_count(8);
            get_tree_edge('l').click();
            check_node_count(3);

            perform_undo();
            check_node_count(8);
            perform_undo();
            check_node_count(9);
            check_undo_enabled(false);
        });

        function modify_tree() {
            get_tree_empty_node('rlrl').click();
            $(INPUT_SELECTOR).trigger('blur-test');
            get_tree_edge('l').click();
            check_node_count(5);
            return '(25, None, (37, (29, None, (30, (0, None, None), None)), None))';
        }

        function modify_tree_again() {
            get_tree_edge('rlr').click();
            check_node_count(3);
            return '(25, None, (37, (29, None, None), None))';
        }

        it("should save modified tree when pressed ok", function() {
            $('#add_test_case').click();
            var tree_string = modify_tree();
            $(BUTTON_OK_SELECTOR).click();
            expectVisible('#tree_editor', false);
            expect($('#test_cases input').val()).toEqual(tree_string);

            $('#test_cases .edit').click();
            var tree_string_again = modify_tree_again();
            $(BUTTON_OK_SELECTOR).click();
            expect($('#test_cases input').val()).toEqual(tree_string_again);
        });

        it("should discard modified tree when pressed cancel", function() {
            $('#add_test_case').click();
            modify_tree();
            $(BUTTON_CANCEL_SELECTOR).click();
            expectVisible('#tree_editor', false);
            expect($('#test_cases input').length).toEqual(0);

            $('#add_test_case').click();
            $(BUTTON_OK_SELECTOR).click();
            var old_tree_string = $('#test_cases input').val();
            $('#test_cases .edit').click();
            modify_tree();
            $(BUTTON_CANCEL_SELECTOR).click();
            expect($('#test_cases input').val()).toEqual(old_tree_string);
        });

        it("should work after manually editing tree string", function() {
            $('#add_test_case').click();
            $(BUTTON_OK_SELECTOR).click();
            $('#test_cases input').val('(5, None, (4, None, None))');
            $('#test_cases .edit').click();
            check_node_count(2);
            $(BUTTON_CANCEL_SELECTOR).click();

            $('#test_cases input').val('Invalid');
            $('#test_cases .edit').click();
            expectVisible('#tree_editor', false);
            expect($('#console').text()).toEqual("Could not parse the test case: unexpected input near 'Invalid'");
        });
    });

    describe('(BST)', function() {
        beforeEach(function() {
            select_task('task5');
        });

        it('should validate BST', function() {
            $('#add_test_case').click();
            expect($('.node.bst-warning').length).toBe(0);

            get_tree_node('lrr').click();
            set_value('28');
            expect($('.node.bst-warning').length).toBe(2);
            expect($('#tree_editor .warnings').text()).toMatch(/not a binary search tree/);

            get_tree_node('lrr').click();
            set_value('23');
            expect($('.node.bst-warning').length).toBe(0);
            expect($('#tree_editor .warnings').text()).toEqual('');

            get_tree_node('lrr').click();
            set_value('28');
            expect($('.node.bst-warning').length).toBe(2);

            get_tree_edge('lrr').click();
            expect($('.node.bst-warning').length).toBe(0);
        });
    });

    describe('(with parameters)', function() {
        beforeEach(function() {
            select_task('task6');
        });

        function get_input(name) {
            return $('#tree_editor .param[data-name=' + name +'] input');
        }

        it("should allow to edit parameters", function() {
            $('#add_test_case').click();
            expect(get_input('A').val()).toEqual('10');
            expect(get_input('B').val()).toEqual('20');
            get_input('A').val('15').change();
            $('#tree_editor .ok').click();

            expect($('#test_cases input').val()).toMatch(/^\(15, 20, /);
        });

        it("should validate parameters", function() {
            $('#add_test_case').click();
            get_input('A').val('1000000000000000').change();
            expect(get_input('A').hasClass('error')).toEqual(true);
            $('#tree_editor .ok').click();

            expect($('#test_cases input').val()).toMatch(/^\(0, 20, /);
            expect($('#console').text()).toMatch(/^Invalid value for parameter A/);
        });
    });
});

$.migrateMute = true;
