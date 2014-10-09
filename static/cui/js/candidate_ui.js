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


// Suppress dot-notation warnings:
// for now, we use urls['name'] convention to refer to URLs.
/*jshint sub: true */

// Warn about globals.
/*jshint undef: true, browser: true, jquery: true */
/*global xmlNodeValue */
/*global Log */
/*global Console */
/*global TestCases */
/*global Clock */
/*global Editor, AceEditor */
/*global surveyShow, surveySubmit, surveyFilled */
/*global Help */
/*global Chat */
/*global TimeTracker */
/*global Diff */


var MAX_SUBMIT_SOLUTION_RETRY_COUNT=15;

// Old autosave (ui.options.save_often == false)
// Save every 2 minutes
var OLD_AUTOSAVE_PERIOD=2*60*1000; // 2 minutes

// New autosave (ui.options.save_often == true)
// We will save:
// - preferably, each time the candidate stops editing...
// - but between MIN_PERIOD and MAX_PERIOD

var CHECK_AUTOSAVE_PERIOD = 1000;
var AUTOSAVE_AFTER_EDIT_PERIOD = 3*1000;
var AUTOSAVE_MIN_PERIOD = 10*1000;
var AUTOSAVE_MAX_PERIOD = 30*1000;

function CandidateUi(options)
{
    var self = {
        options: options,
        task: {
            // The following data is valid only when loaded == true
            loaded: false,
            open: false,
            solution_template: null,
            name: null,
            type: null,
            prg_lang: null,
            human_lang: null,

            // Last solution remembered by the server
            // (for the same task and programming language)
            saved_solution: null,

            // Whether a solution has been modified wrt. to saved_solution
            modified: false,
            last_modify_time: null,

            // Whether a ticket is already closed on the server
            closed: false
        },

        trackers: [],
        resize_hnd: null,

        // Last time new autosave has been *initiated*
        // (so that we don't save too often)
        last_autosave_time: null,

        // list of plugins
        plugins: []
    };

    self.updatePageLayout = function() {
        self.editor.updatePageLayout();
    };

    self.setupResizeEvent = function() {
        $(window).resize(function() {
            Log.debug("candidate window.resize event");
            if (self.resize_hnd !== null)
                clearTimeout(self.resize_hnd);
            self.resize_hnd = setTimeout(function() { self.updatePageLayout(); }, 500);
        });
    };

    self.notifyCheckerTimeoutAction = function() {
        Log.debug("candidate action timeout", "task="+self.task.name+" prg_lang="+self.task.prg_lang);
        Log.flush();

        $.ajax({
            type: "POST",
            url: self.options.urls['timeout_action'],
            data: {
                ticket: self.options.ticket_id,
                task: self.task.name,
                prg_lang: self.task.prg_lang,
                solution: self.editor.getValue()
            },
            dataType: "xml"
        });
    };

    // The ticket has timed out.
    // If already_closed is true, we have been notified of that by server.
    self.actionTimeout = function(already_closed) {
        if (!self.closed) {
            self.closed = true;
            if (!already_closed) {
                self.notifyCheckerTimeoutAction();
            }
        }
        if (!$('#msg_final_task_completed').is(':visible') &&
            !$('#msg_timeout').is(':visible')) {

            $('#msg_timeout').jqmShow();
        }
    };

    self.openTask = function () {
        self.task.open = true;
        self.updateControls();
    };

    self.closeTask = function () {
        self.task.open = false;
        self.updateControls();
    };

    self.updateSaveStatus = function(text){
        $('#save_status').text(text);
    };

    self.updateModified = function() {
        if (self.task.open && self.editor.getValue() != self.task.saved_solution) {
            self.task.last_modify_time = new Date().getTime();
            self.task.modified = true;
            if (self.options.save_often)
                self.updateSaveStatus('');
        } else {
            self.task.modified = false;
            self.task.last_modify_time = null;
            if (self.options.save_often)
                self.updateSaveStatus('All changes saved.');
        }
    };

    ///////////////////SUBMIT ACTIONS////////////////////////////

    self.isCalling = function() {
        return !!self.call;
    };

    self.startCall = function(owner, xhr, data) {
        self.call = {owner: owner,
                     xhr: xhr,
                     timestamp: Date.now()};
        $.extend(self.call, data || {});
        self.updateControls();
    };

    self.callDetails = function() {
        if (!self.call) return "No call";
        else {
            var details = ('call: (owner=' + self.call.owner +
                           ' duration=' + (Date.now() - self.call.timestamp) + 'ms' +
                           ' attempt=' + (self.call.attempt ? self.call.attempt : '1') + ')');
            return details;
        }
    };

    self.clearCall = function() {
        self.call = null;
        self.updateControls();
    };

    // If async is set, perform the action outside of the isCalling machinery.
    self.submitSolution = function(
            mode,
            analyzeStatus,
            successCallback,
            errorCallback,
            extraData,
            async
            ) {

        if (analyzeStatus && async) {
            Log.error('submitSolution: asynchronous calls with analyzeStatus are not supported');
            async = false;
        }

        Log.info('candidate submit solution',
                'mode=' + mode + ', task=' + self.task.name +
                        ', lang=' + self.task.prg_lang
        );
        Log.flush();

        if (!async && self.isCalling()) {
            Log.error('Trying to call submitSolution while still handling a call.');
            if (errorCallback)
                errorCallback();
            return;
        }

        var url;
        if (mode == "verify" || mode == "final" || mode == "save") {
            url = self.options.urls[mode];
        }
        else {
            Log.error('candidate submit solution', 'unknown mode');
            if (errorCallback)
                errorCallback();
            return;
        }
        var solution = self.editor.getValue();
        var task_name = self.task.name;
        var prg_lang = self.task.prg_lang;
        var data = {
            'ticket': self.options.ticket_id,
            'task': task_name,
            'prg_lang': prg_lang,
            'solution': solution,
            'trackers': self.getTrackersValue()
        };
        if (extraData!==undefined) {
            $.each(extraData, function(k,v) { data[k]=v; });
        }

        if (mode=="verify") { // add test cases
            $('#test_cases div.testCase').each(function() {
                var id = $(this).attr("id");
                var value = $(this).find('textarea').val();
                // Replace unicode minus, found in task descriptions.
                var value_clean = value.replace('\u2212', '-');
                // Strip all other non-ASCII characters.
                value_clean = value_clean.replace(/[^\x20-\x7f]/g, '');
                if (value !== value_clean){
                    $(this).find('textarea').val(value_clean);
                    Console.msg(value +" was changed to " + value_clean + ". (Illegal Characters removed.)");
                }
                data[id] = value_clean;
            });
        }

        Log.debug('candidate submit solution', 'ajax started, url=' + url);
        var xhr = $.ajax({
            url: url,
            data: data,
            type: 'POST',
            error: function() {
                if (!async)
                    self.clearCall();
                if (errorCallback)
                    errorCallback();
            },
            success: function(data) {
                Log.debug('candidate submit  solution', 'ajax succeed');
                $.each(self.trackers, function(i,t) { t.reset(); });
                var result = xmlNodeValue(data, 'response result');
                if (result == 'OK' || result == 'LATER') {
                    // All submit views save the solution on success.
                    if (self.task.loaded &&
                        self.task.name == task_name &&
                        self.task.prg_lang == prg_lang) {

                        self.task.saved_solution = solution;
                        self.updateModified();
                    } else {
                        Log.warning('submit returned after switching away from task');
                    }
                }
                if(analyzeStatus) {
                    Log.debug('candidate submit solution', 'analyzing status');
                    self.submitSolutionStatusReceived(
                            data,
                            successCallback,
                            errorCallback
                    );
                } else {
                    Log.debug('candidate submit solution', 'not analyzing status');
                    if (!async)
                        self.clearCall();
                    successCallback(data);
                }
            }
        });
        if (!async)
            self.startCall('submitSolution('+mode+')', xhr, {attempt: 0});
        self.updateControls();
    };

    self.updateControls = function() {
        var may_edit = (self.task.loaded && self.task.open);
        var may_submit_or_reload = (self.task.loaded && self.task.open && !self.isCalling());
        var may_switch = (self.task.loaded && !self.isCalling());
        var submit_or_reload_controls = [
            '#verify_button',
            '#final_button',
            '#save_btn',
            '#current_human_lang',
            '#current_prg_lang',
            '#reset_btn'
        ];

        var switch_controls = [
            '#quit_button'
            // + .task-list
        ];

        self.editor.setEditable(may_edit);

        $(submit_or_reload_controls).each(function (i, id) {
            $(id).prop('disabled', !may_submit_or_reload);
        });

        $(switch_controls).each(function (i, id) {
            $(id).prop('disabled', !may_switch);
        });
        $('.task-list').toggleClass('disabled', !may_switch);

        if (self.task.type == 'bugfixing')
            $('#reset_btn').show();
        else
            $('#reset_btn').hide();

        if (self.options.sequential)
            $('.task-list').addClass('disabled');
    };

    self.submitSolutionStatusReceived = function(data, successCallback, errorCallback) {
        Log.debug('candidate submit solution status received');
        if (self.call === null)
            // Might happen because of checkSubmitButtons
            return;

        var id = xmlNodeValue(data, 'response id');
        var result = xmlNodeValue(data, 'response result');
        var message = xmlNodeValue(data, 'response message');

        if (result == 'LATER') {
            var attempt = self.call.attempt;
            Log.debug('candidate submit solution status received', 'result LATER');
            if (attempt < MAX_SUBMIT_SOLUTION_RETRY_COUNT) {
                if ((attempt + 1) % 5 === 0)
                    Console.msg('Still working...');
                setTimeout(
                    function() {
                        Log.debug('candidate submitSolutionRecheckStatus','timeout succeeded');
                        self.recheckSolutionStatus(
                            attempt + 1,
                            id,
                            successCallback,
                            errorCallback
                        );
                    },
                    (attempt + 1) * 1000
                );
            } else {
                Log.error('candidate submitSolution error' ,'too many retries');
                self.clearCall();
                errorCallback($.parseXML('<message>Sorry, verification timed out. Please try again, and reduce the number of test cases if you have any.</message>'));
            }
        } else {
            self.clearCall();
            Log.handle((result == 'ERROR' ? 'ERROR' : 'INFO'),
                       'candidate submit solution status received',
                       'result ' + result + ' ' + message);
            if (result == 'OK')
                successCallback(data);
            else
                errorCallback(data);
        }
    };

    self.recheckSolutionStatus = function(attempt, id,
                                          successCallback,
                                          errorCallback) {
        Log.debug('candidate recheckSolutionStatus');
        var data = {
            'ticket': self.options.ticket_id,
            'id': id
        };
        var url = self.options.urls['status'];
        Log.debug('candidate recheckSolutionStatus', 'ajax started, url=' + url + ' attempt=' + attempt);
        var xhr = $.ajax({
            url: url,
            data: data,
            type: 'POST',
            error: [self.clearCall,
                    errorCallback],
            success: function(data) {
                Log.debug('candidate recheckSolutionStatus', 'ajax succeeded');
                self.submitSolutionStatusReceived(
                        data,
                        successCallback,
                        errorCallback
                );
            }
        });
        self.startCall('recheckSolution', xhr, {attempt: attempt});
    };

    ///////////////////////// VERIFY ACTION ///////////////////

    self.verifyAction = function() {
        Console.clear();
        Console.msg("Running solution...");
        Log.info("candidate verify action");

        self.submitSolution(
                'verify',
                true,
                self.verifyActionSuccess,
                self.verifyActionError
        );
    };

    self.verifyActionSuccess = function(xml) {
        var verification_ok = false;
        var _message = xmlNodeValue(xml,'response > message');
        if (_message) {
            Console.msg(_message);
        } else {
            var _compile = xmlNodeValue(xml,'compile > ok');

            var _compile_msg = (
                    _compile !== '' ? xmlNodeValue(xml,'compile > message') : ''
                    );

            if (_compile == '1') {
                Console.msg_ok(_compile_msg);
            }
            else {
                Console.msg_error(_compile_msg);
            }

            if (_compile=='1') {
                var _example = xmlNodeValue(xml,'example > ok');

                var _example_msg = (
                        _example !== '' ? xmlNodeValue(xml,'example > message') : ''
                        );

                if (_example == '1') {
                    verification_ok = true;
                }

                /*if (_example == '1') {
                    Console.msg_ok('Example test : '+ _example_msg);
                }
                else {
                    Console.msg_error('Example test : ' + _example_msg);
                }*/

                $('#test_cases div.testCase').each(function() {
                    var id = $(this).attr('id');
                    var test_case = $(this).find('textarea').val();
                    var _ui = xmlNodeValue(xml, id+'> ok');
                    var _ui_msg = (
                            _ui !== '' ? xmlNodeValue(xml, id+' > message') : ''
                            );
                    var _st_obj = $(this).find('.testCaseStatus');

                    /* escape HTML */
                    test_case = $('<span>').text(test_case).html();

                    /*if (_ui == '1') {
                        Console.msg('<span style="color:blue">'+ 'User test case ' + test_case + ' : ' + '</span>' +_ui_msg);
                    }
                    else {
                        Console.msg_error('User test case ' + test_case + ' : '+_ui_msg);
                    }*/
                    Console.msg('<span style="color:blue">'+ 'Your test case ' + test_case + ' : ' + '</span>' +_ui_msg);

                    if (_ui != '1') {
                        verification_ok = false;
                    }
                });

                if (_example == '1') {
                    //Console.msg_ok('Example test : '+ _example_msg);
                    Console.msg_ok('Example test <br>' + '<span style="color:black">' + _example_msg + '</span>');
                }
                else {
                    Console.msg_error('Example test <br>' + '<span style="color:black">' + _example_msg + '</span>');
                }
            }
        }
        if (verification_ok) {
            Console.msg_ok(
                    "Your code is syntactically correct and works properly on the example test."
            );
        } else {
            Console.msg_error(
                    'Detected some errors.'
            );
        }
        var quote = xmlNodeValue(xml,'quote');
        Console.msg_quote(quote);
        self.editor.updatePageLayout();
    };

    self.verifyActionError = function(xml) {
        var _message = "";
        if (xml !== null) {
            _message = xmlNodeValue(xml,'message');
        }

        Log.warning('verification action error', 'message:' + _message);
        if (_message) {
            Console.msg_syserr('Error : ' + _message);
        } else {
            Console.msg_syserr('Connection problem. Please check your Internet connection and try again.');
        }
    };

    /////////////////// SAVE ACTION ////////////////////////////////

    // onSuccess, onError used one when something after saveAction is to be done
    self.saveAction = function(force, onSuccess, onError, extraData, async) {
        if (!self.task.loaded) {
            Log.debug("saveAction", "task not loaded properly, not saving");
            return;
        }

        var solution = self.editor.getValue();
        var prg_lang = self.task.prg_lang;

        if (!force) {
            if (!self.task.modified) {

                Log.debug("candidate skipping save solution action", "no changes detected since last save");
                if (onSuccess) {
                    onSuccess();
                }
                return;
            }
        }

        self.submitSolution(
            'save',
            false,
            function() {
                Log.debug('candidate save action' + async ? ' async' : '',
                          'success');
                if (onSuccess) onSuccess();
            },
            function() {
                Log.warning('candidate save action' + async ? ' async' : '',
                            'error');
                if (onError) onError();
            },
            extraData,
            async);
    };

    self.saveActionSuccess = function() {
        Log.debug('candidate save action', 'success');
    };

    self.saveActionAsync = function(force, onSuccess, onError, extraData) {
        self.saveAction(force, onSuccess, onError, extraData, true);
    };

    //////////////////FINAL SUBMIT ACTION ////////////////////////////////

    self.finalSubmitButtonAction = function() {
        var diff = null;
        if (self.editor.template !== null){
            try {
                diff = Diff.analyze(self.editor.template, self.editor.getValue());
            } catch (err) {
                Log.error('Error computing diff', err);
                // fail gracefully
                diff = null;
                return;
             }
         }

        if (self.task.type == 'bugfixing' &&
            diff &&
            diff.nChanged === 0) {
            $('#bugfix_no_changes').jqmShow();
        } else {
            $('#final_prompt').jqmShow();
        }
    };

    self.finalSubmitAction = function() {
        Console.clear();
        self.finalSubmitActionVerify();
    };

    self.finalSubmitActionError = function(xml) {
        Clock.timeout_temp_disabled = false;
        var _message = (xml !== null) ? xmlNodeValue(xml,'message') : null;

        $('#final_verification .message').html(
                '<b>ERROR</b><br> The final submission failed, try again?' +
                        (_message ? "<br>\n"+_message : '')
        );
        $('#fv_loader').css({display: 'none'});
        $('#final_verification .dialog_buttons').css({display: "block"});

        Log.warning('candidate final submission failed', 'message: ' + _message);
        Console.msg_syserr('Connection problem. Please check your Internet connection and try again.');
        // TODO: Not true, the above error also shows up if the
        // checker is not running.
    };

    self.finalSubmitActionVerify = function() {
        Log.info('candidate final submit verification');
        $('#final_prompt').jqmHide();
        $('#final_verification .dialog_buttons').hide();
        $('#final_verification .message').html(
                '<b>Codility is verifying your solution.</b><br><br>'
        );
        $('#fv_loader').css({display:'block'});
        $('#final_verification').jqmShow();
        self.submitSolution(
                'verify',
                true,
                self.finalSubmitActionVerifySuccess,
                self.finalSubmitActionError
        );
    };

    self.finalSubmitActionVerifySuccess = function(xml) {
        $('#fv_loader').css({display:'none'});
        var _message = xmlNodeValue(xml,'response > message');
        var _compile_ok = xmlNodeValue(xml,'compile > ok');
        var _example_ok = xmlNodeValue(xml,'example > ok');
        var _c_message = xmlNodeValue(xml,'compile > message');
        var _e_message = xmlNodeValue(xml,'example > message');
        if (_compile_ok == "1" && _example_ok == "1") {
            Log.info("candidate final submit verify", 'solution passed example tests');
            self.finalSubmitActionSave(1);
        } else {
            Log.info("candidate final submit verify", "solution not passed example tests");
            if (_message === '' && (_c_message !== '' || _e_message !== '')) {
                _message = _c_message;
                if (_e_message !== '') {
                    _message = _message + '<br>Example test: ' + _e_message;
                }
            }
            $('#final_verification .message').html(
                    '<b>ERROR</b><br> Ooops, we found some errors.' +
                            '<br>Your solution is not correct, do you still want to submit it?<br>' +
                            (_message ? '<div style="width:80%;text-align:left;margin-left:10%;margin-right:10%;margin-top:10px;"><small><b>evaluation details:</b><br><div style="border:1px solid black;padding:5px;overflow:auto;max-height:80px;">'+_message+'</div></small></div>' : '')
            );
            $('#final_verification .dialog_buttons').css({display: "block"});
        }
    };

    self.finalSubmitActionSave = function(is_ok) {
        Log.debug('candidate final submit action save');
        var ver_res;
        if (is_ok) {
            ver_res = 'OK!';
        } else {
            ver_res = 'ERROR!';
        }
        $('#final_verification .dialog_buttons').css({display: "none"});
        $('#final_verification .message').html(
                '<b>solution verification -- ' + ver_res + '</b><br>' +
                        'Your solution is being received and evaluated by our servers.'
        );
        $('#fv_loader').css({display:'block'});

        Clock.timeout_temp_disabled = true; // see Trac #2714
        setTimeout(
                function() {
                    self.submitSolution(
                            'final',
                            false,
                            self.finalSubmitActionSaveSuccess,
                            self.finalSubmitActionError
                    );
                },
                1000
        );
    };

    self.finalSubmitActionSaveSuccess = function(data) {
        Log.debug('candidate final submit action save success');
        self.next_task = xmlNodeValue(data, 'response next_task');

        setTimeout(
                function() {
                    $('#final_verification').jqmHide();
                    self.finalSubmitActionComplete();
                },
                500
        );
    };

    self.finalSubmitActionComplete = function() {
        Log.debug('candidate final submit action complete');
        self.closeTask();
        // $('#current_task').find('option:selected').addClass('task-closed');
        // TODO style for submitted tasks?
        // - note that this will also need to be set upon page load

        if (self.next_task !== '') {
            $('#msg_task_completed').jqmShow();
        } else {
            self.closed = true;
            $('#msg_final_task_completed').jqmShow();
        }
        Clock.timeout_temp_disabled = false;
    };

    self.finalSubmitForceAction = function() {
        self.finalSubmitActionSave(0);
    };

    // Periodic auto-save (!save_often)
    self.oldAutoSave = function() {
        setTimeout(self.oldAutoSave, OLD_AUTOSAVE_PERIOD);

        if (!self.isCalling())
            self.saveActionAsync();
    };

    // Auto-save after candidate stops typing (save_often)
    self.checkAutoSave = function() {
        setTimeout(self.checkAutoSave, CHECK_AUTOSAVE_PERIOD);

        // Check necessary UI preconditions to initiating auto-save.
        if (!self.task.modified)
            return;
        if (self.isCalling())
            return;

        var now = new Date().getTime();

        // Don't save too often
        if (self.last_autosave_time &&
            now - self.last_autosave_time < AUTOSAVE_MIN_PERIOD)
            return;

        // Save after the user stopped editing...
        if (now - self.task.last_modify_time >= AUTOSAVE_AFTER_EDIT_PERIOD ||
            // ... or after some time passed since last save
            (self.last_autosave_time && now - self.last_autosave_time >= AUTOSAVE_MAX_PERIOD)) {

            self.last_autosave_time = now;
            self.saveActionAsync();
        }
    };

    ///////////////////RELOAD TASK ACTIONS////////////////////////////

    self.reloadTask = function(prefer_server_prg_lang) {
        self.task.loaded = false;
        self.task.solution_template = null;
        self.task.type = null;
        self.editor.setTemplate(null);

        var task = $('.task-list').data('value');
        var prg_lang = $('#current_prg_lang').val() || self.options.current_prg_lang;
        var human_lang = $('#current_human_lang').val() || self.options.current_human_lang;

        Log.info("candidate reload task",
                "task=" + task + ", prg_lang=" + prg_lang + ", human_lang" + human_lang
        );

        $('#task_description').html("Loading task description...");
        self.editor.setPrgLang(null);
        self.editor.setValue("Loading solution...");
        self.editor.clearHistory();
        $('#example_input').val('');
        var url = self.options.urls['get_task'];

        var data = {
            'ticket': self.options.ticket_id,
            'task': task,
            'human_lang' : human_lang,
            'prg_lang': prg_lang,
            'prefer_server_prg_lang': !!prefer_server_prg_lang,
        };

        Log.debug("candidate reload task", "ajax start, url=" + url);
        var xhr = $.ajax({
            url: url,
            data: data,
            type: 'POST',
            error: self.reloadTaskError,
            success: function(data) {
                self.reloadTaskSuccess(data, task);
            }
        }).always(self.clearCall);

        self.startCall('reloadTask', xhr);
        self.updateControls();
    };

    self.nextTask = function() {
        Log.info("candidate next task", "next task="+self.next_task);
        self.setCurrentTask(self.next_task);
        TestCases.removeAll();
        self.reloadTask(true);
    };

    self.validSelectableNode = function(t) {
        var t_nodename = t.prop("nodeName");
        if (t_nodename=='TEXTAREA') return true;
        // console.log("t="+t+" t.html="+t.html()+" t.nodeName="+t_nodename);

        if (t_nodename=='TT' || (t_nodename=='SPAN' && t.hasClass('number'))) {
            // selection should start in TT block or <span class='number'>
            return true;
        } else {
            return false;
        }
    };
    self.selectionRestrictedToConsole = function(){
        var commonAncestor = $(window.getSelection().getRangeAt(0).commonAncestorContainer);
        if (commonAncestor.closest('#console').length){
            return true;
        }
        return false;
    };

    // returns TRUE if selected text can be copied
    self.validCopySelection = function(e) {
        if (typeof window.getSelection == "undefined") {
            return false; // IE 8, old browser, disable copy!
        }

        //don't disable copy in the console
        if(self.selectionRestrictedToConsole()) return true;

        var t = $(e.target);
        if (!self.validSelectableNode(t)) return false;

        // recover selection html
        var selection = window.getSelection();
        var range = selection.getRangeAt(0);
        var sobj = $('<div></div>').append(range.cloneContents());
        // console.log("sobj="+sobj+" sobj.html="+sobj.html());

        if (sobj.html().search("<")!=-1) {
            // selection should not contain any HTML tags
            return false;
        }

        return true;
    };

    self.simpleCopyProtection = function() {
        Log.debug("protecting task description");
        $('#brinza-task-description').addClass("protected");

        if (typeof window.getSelection == "undefined") { // old browser: IE 8
            $('#brinza-task-description > *').each(function() {
                $(this).attr("unselectable","on");  // block all selects, PRE && TT are still selectable though
            });
            if ($('#t_overlay').length === 0) {
                $("#brinza-task-description").css({position:"relative"});
                $("#brinza-task-description").prepend('<div id="t_overlay" class="transparent"></div>');
            }
        } else { // normal modern browser
            $('body').off("copy");
            $('body').on("copy",function(e){
                if (self.validCopySelection(e)) {
                    return;
                } else {
                    e.preventDefault();
                }
            });
        }
    };

    self.reloadTaskSuccess = function(data, task) {
        var prg_langs = self.options.prg_langs;
        Log.debug("candidate reload task success");
        var task_status = xmlNodeValue(data, 'response task_status');
        var task_description = xmlNodeValue(data, 'response task_description');
        var task_type = xmlNodeValue(data, 'response task_type');
        var solution_template = xmlNodeValue(data, 'response solution_template');
        var current_solution = xmlNodeValue(data, 'response current_solution');
        var example_input = xmlNodeValue(data, 'response example_input');
        var prg_lang = xmlNodeValue(data, 'response prg_lang');
        var human_lang = xmlNodeValue(data, 'response human_lang');
        var human_lang_list = JSON.parse(xmlNodeValue(data, 'response human_lang_list'));

        self.current_prg_lang_list = JSON.parse(xmlNodeValue(data, 'response prg_lang_list'));
        self.task.name = task;
        self.task.type = task_type;
        self.task.solution_template = solution_template;
        self.task.prg_lang = prg_lang;
        self.task.human_lang = human_lang;
        self.task.saved_solution = current_solution;

        $('#task_description').html(task_description);
        if (!self.options.demo && !self.options.cert) self.simpleCopyProtection();

        $('#current_prg_lang').val(prg_lang);

        var lang_ver = prg_langs[prg_lang].version;
        $('#prg_lang_ver').text(lang_ver);

        // Handle availability of languages.
        $('#current_human_lang option').remove();
        $.each(human_lang_list, function (i, hl) {
            var name = self.options.human_langs[hl].name_in_itself;
            var $option = $('<option>').attr('value', hl).text(name);
            $('#current_human_lang').append($option);
        });
        $('#current_human_lang').val(human_lang);

        $('#current_prg_lang option').remove();
        $.each(self.current_prg_lang_list, function (i, pl) {
            var name = self.options.prg_langs[pl].name;
            var $option = $('<option>').attr('value', pl).text(name);
            $('#current_prg_lang').append($option);
        });
        $('#current_prg_lang').val(prg_lang);

        if (!$.inArray(human_lang, human_lang_list))
            $('#current_human_lang option:first').attr('selected',true);


        self.editor.setPrgLang(prg_lang);

        //new lines should be allowed by default
        self.editor.setNoNewLines(false);
        if (self.task.type == 'bugfixing'){
            self.editor.setTemplate(self.task.solution_template);
            //prevent complete deletion of lines
            self.editor.setNoNewLines(true);
        }
        self.editor.setValue(current_solution);
        self.editor.clearHistory();
        $('#example_input').val(example_input);

        var show_test_cases = (task_status == 'open' && prg_lang != 'sql' && !TestCases.limitReached());

        if (task_status == 'open') {
            self.openTask();
        }
        else if (task_status == 'closed') {
            self.closeTask();
            $('#msg_task_closed').jqmShow();
        }
        else {
            Log.error("candidate reload task success", "unknown task_status " + task_status);
        }

        if (show_test_cases) {
            TestCases.enable();
        } else {
            TestCases.disable();
        }
        self.task.loaded = true;
        self.updateControls();
    };

    self.changePrgLangAction = function() {
        self.saveAction(false,
                        self.reloadTask,
                        function() {
                            Console.msg_syserr("Could not change language");
                            $('#current_prg_lang').val(self.task.lang);
                        });
    };

    self.reloadTaskError = function() {
        Console.msg_syserr("Could not load task");
        $('#task_description').html("Could not load task description");
        self.editor.setPrgLang(null);
        self.editor.setValue("Could not load solution. Please refresh the page in the browser.");
        self.editor.clearHistory();
        $('#example_input').val("");
    };

    self.changeTaskActionError = function() {
        Console.msg_syserr("Could not change task");
        self.setCurrentTask(self.task.name);
    };

    self.changeTaskAction = function() {
        self.saveAction(false,
                        function() { self.reloadTask(true); },
                        self.changeTaskActionError);
        TestCases.removeAll();
    };

    self.changeHumanLangAction = function() {
        self.saveAction(false,
                        self.reloadTask,
                        self.changeHumanLangError);
    };

    self.changeHumanLangError = function() {
        Console.msg_syserr("Could not change human language");
    };

    self.resetAction = function() {
        self.saveActionAsync();
        self.editor.setValue(self.task.solution_template);
    };

    self.actionLogout = function(mode) {
        Log.info("candidate action logout");
        Clock.active = false;
        self.exit(self.options.urls['close']+'?'+mode+'=1');
    };

    self.exit = function(url) {
        window.location.href = url;
    };

    self.quitAction = function() {
        Log.info("candidate quit action");
        self.saveActionAsync();
        $('#quit_prompt').jqmShow();

        $("#q_yes").click(function () {
            $('#quit_prompt').jqmHide();
            self.actionLogout("resign");
        });
        return true;
    };

    self.resizeConsoleAction = function() {
        $('#console').toggleClass("maximized");
        if ($('#console').hasClass("maximized")){
            $('#resize_console_button').val("↓");
        }
        else{
            $('#resize_console_button').val("↑");
        }
        self.updatePageLayout();
    };

    self.setupEditor = function() {
        self.editor = AceEditor();
        self.editor.onChangeEvent(self.updateModified);
    };

    self.setupModals = function() {
        if (self.options.demo) {
            $('.in-demo').show();
            $('.no-demo').hide();
        }

        $("#quit_prompt").jqm({modal: true});
        $("#final_prompt").jqm({modal: true});
        $("#final_verification").jqm({modal: true});
        $("#msg_task_completed").jqm({modal: true});
        $('#msg_task_closed').jqm({modal: true});
        $("#bugfix_no_changes").jqm({modal: true});
        $("#exit_initial_help").jqm({modal: true});

        function surveyPopup($elt, logout_reason) {
            if (self.options.show_survey) {
                $elt.find('.no-survey-continue').hide();
                $elt.find('.survey-msg').show();
            }
            $elt.jqm({
                modal: true,
                onShow: function(hash) {
                    if (self.options.show_survey) {
                        Clock.active = false;
                        surveyShow(hash.w);
                    }
                    hash.w.show();
                },
                onHide: function(hash) {
                    if (self.options.show_survey && surveyFilled()) {
                        surveySubmit(
                            self.options.urls['submit_survey'],
                            function() {
                                self.actionLogout(logout_reason);
                            }
                        );
                    } else {
                        self.actionLogout(logout_reason);
                    }
                }
            });
        }
        surveyPopup($("#msg_final_task_completed"), 'final_task_completed');
        surveyPopup($("#msg_timeout"), 'timeout');
    };

    self.setupButtons = function() {
        $('#quit_button').click(self.quitAction);

        $('#final_button').click(self.finalSubmitButtonAction);
        $('#next_task_button').click(function() {
            $('#msg_task_completed').jqmHide();
            self.nextTask();
        });

        $('#exit_intro_yes').click(function() {
            $('#exit_initial_help').jqmHide();
            self.startTicket();
        });
        $('#exit_intro_no').click(self.initialHelp);

        $("#fp_yes").click(self.finalSubmitAction);
        $("#bugfix_yes").click(function() {
            $('#bugfix_no_changes').jqmHide();
            self.finalSubmitAction();
        });
        $("#fv_yes").click(self.finalSubmitForceAction);

        $('#current_prg_lang').change(self.changePrgLangAction);
        if (!self.options.sequential)
            $('.task-list').on('click', '.task:not(.inactive)', function(e) {
                if ($('.task-list').hasClass('disabled'))
                    return;
                self.setCurrentTask($(e.target).data('name'));
                self.changeTaskAction();
            });
        $('#current_human_lang').change(self.changeHumanLangAction);

        $('#resize_console_button').click(self.resizeConsoleAction);
        $('#verify_button').click(self.verifyAction);
        $('#reset_btn').click(self.resetAction);
        $('#help_btn').click(function() { self.showHelp(false, null); });
        $('#survey_skip_button').click(function() {
            $('#survey').parent().jqmHide();
        });
        $('#survey_continue_button').click(function() {
            $(this).val("submit survey");
            $('#survey tbody.hidden_part').removeClass('hidden_part');
            $('.hide-for-survey').hide();
            $(this).hide();
            $('#survey_submit_button').show();
        });
        $('#survey_submit_button').click(function() {
            $('#survey').parent().jqmHide();
        });
    };

    self.setupSelects = function() {
        var n_tasks = self.options.task_names.length;
        $.each(self.options.task_names, function(i, task_name) {
            var $option = $('<li>').addClass('task').data('name', task_name)
                .text('Task ' + (i+1));
            $('.task-list').append($option);
        });
        self.setCurrentTask(self.options.current_task_name);
        if (n_tasks > 1) {
            $('.current_task_select').show();
        }
    };

    self.setCurrentTask = function(name) {
        $('.task-list').data('value', name);
        $('.task-list .task').each(function() {
            $(this).toggleClass('active', ($(this).data('name') === name));
        });
    };

    self.getTrackersValue = function() {
        var res = {};
        $.each(self.trackers, function(i,t) {
            res[t.name] = JSON.stringify(t.exportData());
        });
        // console.log("getTrackersValue="+JSON.stringify(res));
        return res;
    };

    self.setupTrackers = function() {
        // tracking time spent in the candidate UI
        var window_focus_tracker = new TimeTracker('focus', self.options.time_elapsed_sec);
        window_focus_tracker.turnOn();
        $(window).on('focus',function() { window_focus_tracker.turnOn(); });
        $(window).on('blur',function() { window_focus_tracker.turnOff(); });
        self.trackers.push(window_focus_tracker);

        // tracking keypresses
        var key_tracker = new TimeTracker('keypress', self.options.time_elapsed_sec);
        $('#edit').on('keypress',function() { key_tracker.tick(); });
        self.trackers.push(key_tracker);

        function get_text(e) {
            // The parameter to onCopyEvent and onPasteEvent seems to depend on the weather. Needs investigation.
            // As a hotfix - try both and coerce to string.
            var text;
            if (typeof e === 'string') {
                text = e;
            } else if (typeof e.text === 'string') {
                text = e.text;
            } else {
                text = '';
            }
            // Clean newlines
            text = text.replace(/\r\n/g, "\n");
            return text;
        }

        // tracking copy & paste
        self.editor.onCopyEvent(function(e) {
            self.editor.last_copy = get_text(e);
        });
        self.editor.onPasteEvent(function(e) {
            var data = get_text(e.text);
            if (self.editor.last_copy===data) return;
            self.editor.last_paste=data;
            setTimeout(function() {
                var last_paste = $.trim(self.editor.last_paste);
                // track only pastes with at least 2 lines
                if (last_paste.split("\n").length<2) return;

                var solution = self.editor.getValue();
                var ppos = solution.indexOf(last_paste);
                var plen = last_paste.length;
                if (ppos==-1) return; // paste can not be found in solution => skip

                self.saveActionAsync(
                    true,
                    null,
                    null,
                    {
                        "paste_start": ppos,
                        "paste_end": ppos+plen
                    }
                );
            },100);
        });
    };

    self.addPlugin = function (plugin) {
        if (self.plugins.indexOf(plugin) !== -1) {
            throw new Error("Trying to load previously loaded plugin");
        }
        plugin.load(self);
        self.plugins.push(plugin);
    };

    self.removePlugin = function (plugin) {
        var index = self.plugins.indexOf(plugin);
        if (index === -1) {
            throw new Error("Trying to unload not loaded plugin");
        }
        self.plugins.splice(index, 1);
        plugin.unload();
    };

    self.removePlugins = function () {
        var plugins = self.plugins;
        self.plugins = [];
        plugins.forEach(function (plugin) {
            try {
                plugin.unload();
            } catch (err) {
                Log.error("Failed to unload plugin", err);
            }
        });
    };

    self.showHelp = function(isInitial, onClose){
        var task_count, prg_lang_name, prg_lang_count;
        task_count = self.options.task_names.length;
        if(self.current_prg_lang_list !== undefined){
            prg_lang_count = self.current_prg_lang_list.length;
            prg_lang_name = self.current_prg_lang_list[0];
        }
        else{//just show message for multiple languages
            prg_lang_count = 2;
        }

        var help = Help(isInitial, task_count, prg_lang_name, prg_lang_count, self.options.support_email);
        if (self.chat)
            help.enableChat(self.chat);
        help.showHelp(onClose);
    };

    self.startTicket = function(){
        var url = self.options.urls["start_ticket"];
        var data = {
            'ticket': self.options.ticket_id,
        };
        var xhr = $.ajax({
            url: url,
            data: data,
            type: 'POST',
            error: self.startTicketError,
            success: function(data) {
                self.startTicketSuccess(data);
            }
        }).always(self.clearCall);

        self.startCall('startTicket', xhr);
    };

    self.startTicketSuccess = function(data){
        var error = xmlNodeValue(data, 'error');
        if (data.redirect) {
            // might issue a redirect if a downtime is approaching
            window.location.href = data.redirect;
        }
        else if (error){
            var err_diag = $('#ticket_start_error').jqm({modal: true});
            err_diag.find('.error-message').html(error);
            err_diag.jqmShow();
        }
        else{
            self.initTask();
        }
    };
    self.startTicketError = function(){
        Console.msg_syserr("Network error encountered while trying to start your test. "+
            "Try reloading this page.");
    };

    self.WELCOME_MESSAGE = (
        'This is <a href="https://github.com/codility/cui" target="_blank">CUI</a>.  ' +
        'CUI is free software.  ' +
        'See <a href="https://github.com/Codility/cui/blob/master/COPYING.LESSER" target="_blank">COPYING.LESSER</a> ' +
        'and <a href="https://github.com/Codility/cui/blob/master/AUTHORS" target="_blank">AUTHORS</a> ' +
        'for details.'
    );

    self.initTask = function() {
        Clock.init(self.options.ticket_id, self.options.urls['clock'], self.options.time_remaining_sec, self.options.time_elapsed_sec);

        self.reloadTask();
        if (self.options.save_often)
            setTimeout(self.checkAutoSave, CHECK_AUTOSAVE_PERIOD);
        else
            setTimeout(self.oldAutoSave, OLD_AUTOSAVE_PERIOD);
        self.updateControls();

        if (self.options.show_welcome) {
            Console.msg_ok(self.WELCOME_MESSAGE);
        }
    };

    self.initialHelp = function() {
        //show time asigned to task
        Clock.setTime(self.options.time_remaining_sec);
        //'all changes saved'
        self.updateSaveStatus("You will see save status here");

        setTimeout(function(){
            self.showHelp(true, function(current_step) {
                $('#exit_initial_help').jqmShow();
            });
        }, 500);
    };

    self.init = function() {
        self.setupEditor();
        self.setupModals();
        self.setupButtons();
        self.setupSelects();
        if (!self.options.demo && !self.options.cert) self.setupTrackers();
        TestCases.init();

        if (self.options.show_chat)
            self.chat = Chat(self.options.support_email);
        //size editor and task description pane properly
        self.updatePageLayout();

        self.setupResizeEvent();
        if (self.options.show_help){
            self.initialHelp();
        }
        else{
            //calling startTicket multiple times on a ticket is safe
            self.startTicket();
        }

    };

    // Unpin global events
    self.shutdown = function() {
        $(window).off('focus');
        $(window).off('blur');
        self.removePlugins();
    };

    self.data = {};

    return self;
}
