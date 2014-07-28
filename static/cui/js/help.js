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

/* global Log, taskCount, stepsTexts, introJs*/


function buildSteps(){
    var ret = [
        { element: "#task_description",
          intro:stepsTexts.problemDescription,
          position: "right",
          numberPosition: "right"
        },
    ];
    if (taskCount> 1){
        ret = ret.concat(
            { element: ".task-list",
              intro:stepsTexts.tasksTab
            }
    );}
    ret = ret.concat([

        { element: "#clock",
          intro:stepsTexts.timer,
          position:"left",
          numberPosition:"bottom",
          padding: 0
        },
        { element: "#prg_lang_list",
          intro:stepsTexts.prgLang
        },
        { element: "#edit",
          intro:stepsTexts.editor,
          position: "left"
        },
        { element: "#save_status",
          intro:stepsTexts.solutionSaved,
          position: "top"
        },
        { element: "#verify_button",
          intro:stepsTexts.runButton,
          position: "top"
        },
        { element: "#console",
          intro:stepsTexts.outputWindow,
          position: "top"
        },
        { element: "#resize_console_button",
          intro:stepsTexts.outputWindowResize,
          position: "left"
        },
        { element: "#add_test_case",
          intro:stepsTexts.testData,
          position: "top",
          numberPosition: "right"
        },
        { element: "#final_button",
          intro:stepsTexts.submitButton,
          position: "top"
        },
        { element: "#quit_button",
          intro:stepsTexts.quitButton,
          position: "top"
        },
        {
          intro:stepsTexts.exitOverlay
        }
    ]);
    return ret;
}

function showHelp() {
    var intro = introJs();
    intro.setOption('steps', buildSteps());
    intro.setOption('disableInteraction', true);
    intro.start();
}
