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

/* global Log, Console, introJs */

var Help = function(taskCount, prgLangName, prgLangCount){
    var self = {};
    self.stepsTexts = {
        problemDescription : 'Read the problem description.',
        tasksTab : 'You can see all the tasks here.'+
                   ' You can switch freely between them.',
        timer : 'The timer is counting down the time for the whole test. '+
                'If you do not manage to submit all the tasks before the '+
                'time runs out, we will save your latest solution(s) entered '+
                'and submit it automatically.',
        prgLang: prgLangCount > 1?
        /*For tasks with multiple programming language*/
        'Choose the programming language. If you switch to another '+
        'programming language in the middle of writing a solution, '+
        'your solution will disappear. If you, however, switch back '+
        'to the previous language, your solution will appear again.':
        /*For tasks with just one programming language*/
        'You will be solving this problem in '+prgLangName+'.',
        editor : 'Write the solution for the problem using the editor, '+
                 'your solution should include the function as defined in '+
                 'the task description. Your solution can include other '+
                 'functions, procedures and methods.',
        solutionSaved : "Your solutions are being saved continuously, "+
                        "however don't forget to submit your solution for "+
                        "evaluation once you're done.",
        runButton : 'Run your solution to see if it a) compiles, '+
                    'b) returns a correct result given the exemplary '+
                    'data from the task description, '+
                    'c) terminates within an acceptable period of time.'+
                    ' Running your solution will help you to avoid simple'+
                    ' mistakes. You can verify your solution multiple times.'+
                    ' The number of "run" requests will not influence '+
                    'your score. The output window can be increased.',
        testData : 'You can run your solution on your test data to see '+
                   'what results it computes, you will not be informed '+
                   'about the correctness of this result. '+
                   'You can add a maximum of 5 test cases at once.',

        outputWindow : 'Compilation and verification output is visible here.',
        outputWindowResize : 'The output window can be increased.',
        submitButton :  taskCount > 1?
        /*For tests with more than one tasks*/
        "Submit your solution for final evaluation. "+
        "This will close the task and you will not be able "+
        "to make any more changes. You don't have to submit your solution "+
        "before moving to another task but you need to submit each "+
        "task solution separately.":
        /*For tests with just one task*/
        "This will end this session. You can submit your solution only once.",
        quitButton : 'Quit will finish this session without sending '+
                     'your solution for evaluation. You can re-open the '+
                     'session, but quitting does not put the timer on hold.',
        exitOverlay : 'Click anywhere to hide the help overlay.'
    };

    function _buildSteps(){
        var ret = [
            { element: "#task_description",
              intro:self.stepsTexts.problemDescription,
              position: "right",
              numberPosition: "right"
            },
        ];
        if (taskCount> 1){
            ret = ret.concat(
                { element: ".task-list",
                  intro:self.stepsTexts.tasksTab
                }
        );}
        ret = ret.concat([

            { element: "#clock",
              intro:self.stepsTexts.timer,
              position:"left",
              numberPosition:"bottom",
              padding: 0
            },
            { element: "#prg_lang_list",
              intro:self.stepsTexts.prgLang
            },
            { element: "#edit",
              intro:self.stepsTexts.editor,
              position: "left"
            },
            { element: "#save_status",
              intro:self.stepsTexts.solutionSaved,
              position: "top"
            },
            { element: "#verify_button",
              intro:self.stepsTexts.runButton,
              position: "top"
            },
            { element: "#console",
              intro:self.stepsTexts.outputWindow,
              position: "top"
            },
            { element: "#resize_console_button",
              intro:self.stepsTexts.outputWindowResize,
              position: "left"
            },
            { element: "#add_test_case",
              intro:self.stepsTexts.testData,
              position: "top",
              numberPosition: "right"
            },
            { element: "#final_button",
              intro:self.stepsTexts.submitButton,
              position: "top"
            },
            { element: "#quit_button",
              intro:self.stepsTexts.quitButton,
              position: "left"
            },
            {
              intro:self.stepsTexts.exitOverlay
            }
        ]);
        return ret;
    }

    self.enableChat = function(chat) {
        self.chat = chat;
    };

    function _loadChat() {
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
        window.freshchat_setting=self.chat.freshchat_setting;
    }

    function _activateChat() {
        if (!window.freshchat_setting) {
            // the chat should open automatically
            _loadChat();
        } else {
            var $fc = $('#fc_chat_header');
            if ($fc.length === 0) {
                Log.error("couldn't load freshchat");
                Console.error("Sorry, loading the chat failed.");
                Console.error("If you require assistance, please contact " +
                              "<a href='mailto:" + self.chat.support_email +
                              "'>" + self.chat.support_email + "/>.");
                return;
            }

            if (!$('#fc_chat_window').is(':visible')) {
                $fc.click();
            } else {
                $('#fc_chat_layout').animate({
                    'transform': 'scale(1.2)'
                }, 200).animate({
                    'transform': 'scale(1)'
                }, 200);
            }
        }
    }

    function _addChatToStep() {
        var introJs = this;
        var $stepElt = $('.introjs-tooltip');
        // added already
        if ($stepElt.find('.chat').length > 0)
            return;

        var $chatElt = $('<div class="chat"><br>Problems? <a href="#">Chat with us.</a></div>');
        $chatElt.find('a').click(function(e) {
            e.preventDefault();
            introJs.exit();
            _activateChat();
        });
        $stepElt.append($chatElt);
    }

    self.showHelp = function() {
        var intro = introJs();
        intro.setOption('steps', _buildSteps());
        intro.setOption('disableInteraction', true);

        if (self.chat) {
            intro.onafterchange(_addChatToStep);
        }

        intro.start();
    };
    return self;
};
