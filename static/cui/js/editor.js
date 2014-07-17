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
/* global ace */

function Editor() {
    var self = {
        template: null
    };

    self._updateTaskDescriptionHeight = function(h) {
        $('#task_description').css({'height': h+'px'});
    };

    self._updateEditorHeight = function(h) {
        $('#solution').css({minHeight: h});
        $('#solution').css({height: h});
    };

    self.updatePageLayout = function() {
        var wh = $(window).outerHeight();
        $('#page').css({'height': wh+'px'});

        var right_h = $('#rightColumn > div').outerHeight();
        var right_under_h = $('#rightColumn .under-edit').outerHeight();
        var editor_h = right_h - right_under_h;

        var left_h = $('#task > div').outerHeight();
        var left_under_h = $('#task .under-task').outerHeight();
        var task_descr_h = left_h - left_under_h;

        self._updateEditorHeight(editor_h);
        self._updateTaskDescriptionHeight(task_descr_h);
    };

    self.getValue = function() {
        return $('#solution').val();
    };

    self.setValue = function(value) {
        $('#solution').val(value);
    };

    self.setTemplate = function(template) {
        self.template = template;
    };

    self.setPrgLang = function(prg_lang) { };

    self.setEditable = function(editable) { };

    self.clearHistory = function () { };

    self.onCopyEvent = function(f) { };
    self.onPasteEvent = function(f) { };
    self.onChangeEvent = function(f) {
        $('#solution').on('change', f);
    };
    self.setNoNewLines = function() {};
    self.setReadOnlyRegions = function() {};
    self.enforceReadOnlyRegions = function() {};

    return self;
}


function AceEditor() {
    var self = Editor();

    try {
        $('#solution').after('<pre class="ace" display="none"></pre>');
        self.ace = ace.edit($('.ace').get(0));
        $('#solution').hide();
        $('.ace').show();
    } catch(err) {
        Log.error("Candidate interface", "Error setting up Ace", err);
        window.alert("The rich code editor failed to load.\n" +
                     "Please try reloading or use another browser.\n" +
                     "\n" +
                     "If you continue to have problems, please contact support@codility.com.");
        // Fall back to normal textarea-based Editor
        return self;
    }

    ace.require('ace/ext/language_tools');
    self.ace.setShowPrintMargin(false);
    self.ace.setOptions({ enableBasicAutocompletion: true });
    self.ace.setBehavioursEnabled(false);
    var session = self.ace.getSession();
    session.setTabSize(4);
    session.setUseSoftTabs(true);
    session.setUseWrapMode(true);

    self.Range = ace.require('ace/range').Range;
    self.Anchor = ace.require('ace/anchor').Anchor;
    self.HashHandler = ace.require("ace/keyboard/hash_handler").HashHandler;

    //initialize diff engine
    self.diffengine = ace.require('diffengine').DiffEngine(self);
    self.diffengine.enable(true);

    self._updateEditorHeight = function(h) {
        $('.ace').css({minHeight: h});
        $('.ace').css({height: h});
        self.ace.resize();
    };

    self._clean = function() {
        self.ace.replaceAll('-', {needle:'\u2212'});  // convert unicode minus to hyphen-minus (#1668)
    };

    self.getValue = function() {
        self._clean();
        return self.ace.getValue();
    };

    self.setValue = function(value) {
        self.ace.getSession().setValue(value);
        self.ace.clearSelection();
        if (self.handleChange)
            self.handleChange();
    };

    self._prgLangToEditorMode = function(prg_lang) {
        var lang_dict = {
            'c': 'c_cpp',
            'cpp': 'c_cpp',
            'cs': 'csharp',
            'java': 'java',
            'js': 'javascript',
            'lua': 'lua',
            'm': 'objectivec',
            'py': 'python',
            'pas': 'pascal',
            'php': 'php',
            'pl': 'perl',
            'rb': 'ruby',
            'scala': 'scala',
            'sql': 'sql',
            'vb': 'vbscript'
        };
        return lang_dict[prg_lang] || 'plain_text';
    };

    self.setPrgLang = function(prg_lang) {
        var mode = 'ace/mode/'+self._prgLangToEditorMode(prg_lang);
        if (prg_lang == 'php') // Highlight PHP without <?php tag
            self.ace.getSession().setMode({path: mode, inline: true});
        else
            self.ace.getSession().setMode({path: mode});
    };

    self.setEditable = function(editable) {
        self.ace.setReadOnly(!editable);
    };

    self.clearHistory = function() {
        self.ace.getSession().setUndoManager(new ace.UndoManager());
    };

    self.onCopyEvent = function(f) { self.ace.on('copy',f); };
    self.onPasteEvent = function(f) { self.ace.on('paste',f); };
    self.onChangeEvent = function(f) {
        self.handleChange = f;
        self.ace.on('change', f);
    };

    /* Input Restriction */
    self.markers = [];
    self.readOnlyRanges = [];
    self.noNewLines = false;
    self.setReadOnlyRegions = function(regions) {
        //regions is a list of ranges
        //if only the start position is specified, the range terminates at end-of-line
        //this makes the assumpiton that the line is not empty
        $.each(regions, function(index, value) {
            if (value.start) {
                var start = value.start;
                var end = {};
                if (!value.end) {
                    end.row = start.row;
                    end.column = self.ace.getSession().getDocument().getLine(start.row).length;
                } else {
                    end = value.end;
                }
                var doc = self.ace.getSession().getDocument();
                var start_anchor = new self.Anchor(doc, start.row, start.column);
                start_anchor.setPosition(start.row, start.column, true);
                var end_anchor = new self.Anchor(doc, end.row, end.column);
                end_anchor.setPosition(end.row, end.column, true);
                self.readOnlyRanges.push({"start": start_anchor, "end": end_anchor});
            }
        });
    };
    self.setNoNewLines = function(bool){
        self.noNewLines = Boolean(bool);
        if (self.noNewLines){
            self.ace.keyBinding.addKeyboardHandler(self.keyHandlers.enterHandler);
        }
        else{
            self.ace.keyBinding.removeKeyboardHandler(self.keyHandlers.enterHandler);
        }
    };
    self.keyHandlers = {
        enterHandler : new self.HashHandler([{// to assign a name to return key
            name: "return",
            bindKey: "Return|Shift-Return",
            descr: "Always block Return",
            exec: function(ed){
                return false;

            }
        }])
    };
    self.enforceReadOnlyRegions = function(e) {
        //check that ranges have been sent
        var command = e.command;
        var contains = false;
        var multiLineSelect = false;
        if (self.readOnlyRanges) {
            $.each(self.readOnlyRanges, function(index, val){
                contains = self.inRange(val);
                if (contains){
                    return false;
                }
            });
        }
        if (self.noNewLines){
            multiLineSelect = self.ace.getSession().getSelection().isMultiLine();
        }
        if (contains || multiLineSelect){
            if (!command.readOnly){//commad.readOnly is true if the command doesn't cause a write
                e.preventDefault();
                e.stopPropagation();
                Console.msg_error("Your current selection includes portions that are readonly");
            }
        }
        else if(self.noNewLines){
            var currentCursor = self.ace.getCursorPosition();
            var rightEdge = currentCursor.column == self.ace.getSession().getLine(currentCursor.row).length;
            var leftEdge = currentCursor.column === 0;
            var stop = self.isPrevented(command)||self.isReturn(command) || (self.isDelete(command) && rightEdge) || (self.isBackspace(command) && leftEdge);
            if (stop){
                //console.log(command);
                e.preventDefault();
                e.stopPropagation();
                Console.msg_error("You are not allowed to add or remove whole lines in this task");
            }
        }
    };
    self.inRange = function(range){ //check if the current range intersects with selection
        var sel = self.ace.getSession().getSelection().getRange();
        var start = range.start;
        var end = range.end;
        range = new self.Range(start.row, start.column, end.row, end.column);
        return range.intersects(sel);
    };
    self.isDelete = function(command){
        return command.name in {"del" : true, "removetolineend" : true, "removewordright": true};
    };
    self.isBackspace = function(command){
        return command.name in {"backspace":true,  "cut-or-delete":true, "removetolinestart":true, "removewordleft": true};
    };
    self.isReturn = function(command){
        return command.name in {"return": true};
    };
    self.isPrevented = function(command){
        return command.name in {"cut":true,
                                "removeline":true,
                                "duplicateSelection":true,
                                "copylinesup":true,
                                "copylinesdown": true,
                                "movelinesup": true,
                                "movelinesdown" : true,
                                "splitline" : true};
    };

    self.ace.commands.on("exec", self.enforceReadOnlyRegions);

    return self;
}
