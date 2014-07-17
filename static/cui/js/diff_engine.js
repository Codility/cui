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

/*global ace, Diff*/
/*jshint multistr:true */
/**
 * Implements inline showing of diffs
 * Makes use of Line Widgets
 * Inspired by https://github.com/ajaxorg/ace/blob/master/lib/ace/ext/error_marker.js
 */
ace.define('diffengine', ['require', 'exports', 'module', 'ace/line_widgets', 'ace/lib/dom', 'ace/range'], function(require, exports, module) {
    "use strict";
    var LineWidgets = require("ace/line_widgets").LineWidgets;
    var dom = require("ace/lib/dom");
    var Range = require("ace/range").Range;
    var prev_row = null;

    exports.DiffEngine = function(editor, options) {
        var self = {};
        self.options = options;
        self.editor = editor;
        self.diff = {};
        self.session = self.editor.ace.session;
        if (!self.session.widgetManager) {
            self.session.widgetManager = new LineWidgets(self.session);
            self.session.widgetManager.attach(self.editor.ace);
        }
        self.enable = function(bool) {
            if (bool) {
                self.editor.ace.on('change', self.onDocumentChange);
                self.editor.ace.on('changeSelection', self.onSelectionChange);
            } else {
                self.editor.ace.off('change', self.onDocumentChange);
                self.editor.ace.off('changeSelection', self.onSelectionChange);
            }
        };
        self.markers = [];
        self.onDocumentChange = function() {
            //if document changed show widget if the line was previously unedited
            var prev_unedited = !(prev_row in self.diff);
            self.diff = self._calculateDiff();
            var now_edited = prev_row in self.diff;
            if (prev_unedited && now_edited){
                prev_row = null;
            }

            //remove previous markers
            if (self.markers.length) {
                $.each(self.markers, function(idx, val) {
                    self.editor.ace.session.removeMarker(val);
                });
            }
            //add new markers
            var diff_keys = Object.keys(self.diff);
            if (diff_keys.length) {
                //decorate appropraite lines as green and red
                $.each(diff_keys, function(idx, line) {
                    var lineEnd = self.editor.ace.session.getLine(line).length;
                    self.markers.push(self.editor.ace.session.addMarker(new Range(line, 0, line, lineEnd), "highlight-changed-line", "fullLine"));
                });
            }
        };
        self.onSelectionChange = function() {
            if (self.editor.ace.getSession().getSelection().isMultiLine() || !self.diff)
                return;
            var pos = self.editor.ace.getCursorPosition();
            var currentRow = pos.row;
            if (currentRow in self.diff && prev_row !== currentRow) {
                var oldWidget = self.session.lineWidgets && self.session.lineWidgets[currentRow];
                if (oldWidget) {
                    oldWidget.destroy(true);
                }
                var widget = self._buildWidget(pos);
                if (widget) {
                    self.editor.ace.session.widgetManager.addLineWidget(widget);
                }
            }
            prev_row = currentRow;
        };
        self._buildWidget = function(position) {
            var row = position.row;
            var w = null;
            var className = self.options && self.options.className;
            if (self.template_lines && self.template_lines.length > row) {
                w = {
                    row: row,
                    fixedWidth: true,
                    coverGutter: true,
                    el: dom.createElement("div")
                };

                var el = w.el.appendChild(dom.createElement("div"));
                var arrow = w.el.appendChild(dom.createElement("div"));
                if (className) {
                    arrow.className = "diff_widget_arrow " + className;
                } else {
                    arrow.className = "diff_widget_arrow diff_widget_default";
                }
                // '^' position
                var left = self.editor.ace.renderer.$cursorLayer.getPixelPosition({'row':position.row, 'column': 0}).left;
                arrow.style.left = left + self.editor.ace.renderer.gutterWidth - 5 + "px";

                w.el.className = "diff_widget_wrapper";
                if (className) {
                    el.className = "diff_widget " + className;
                } else {
                    el.className = "diff_widget diff_widget_default";
                }
                el.innerHTML = self._renderTemplateLine(row);
                el.style.paddingLeft = self.editor.ace.renderer.gutterWidth + self.editor.ace.renderer.$padding + "px";

                //widget should self distruct if selection/session changes
                w.destroy = function(ingoreMouse) {
                    if (self.editor.ace.$mouseHandler.isMousePressed && !ingoreMouse)
                        return;
                    self.session.widgetManager.removeLineWidget(w);
                    self.editor.ace.off("changeSelection", w.destroyOnExit);
                    self.editor.ace.off("mouseup", w.destroyOnExit);
                    self.editor.ace.off("changeSession", w.destroy);
                    self.editor.ace.off("change", w.destroy);
                    self.editor.ace.off("change", w.destroyOnUnedit);
                };
                w.destroyOnExit = function() {
                    var pos = self.editor.ace.getCursorPosition();
                    var currentRow = pos.row;
                    if (w.row != currentRow) {
                        w.destroy();
                    }
                };
                w.destroyOnUnedit = function(){
                    var pos = self.editor.ace.getCursorPosition();
                    var currentRow = pos.row;
                    if (!(currentRow in self.diff)){
                        w.destroy();
                    }
                };
                self.editor.ace.on("mouseup", w.destroyOnExit);
                self.editor.ace.on("changeSelection", w.destroyOnExit);
                self.editor.ace.on("changeSession", w.destroy);
                self.editor.ace.on("change", w.destroyOnExit);
                self.editor.ace.on("change", w.destroyOnUnedit);
            }
            return w;
        };
        self._renderTemplateLine = function(row) {
            var tokenizer = self.editor.ace.session.getMode().getTokenizer();
            var row_text = self.template_lines[row];
            var tokens = tokenizer.getLineTokens(row_text).tokens;
            var stringBuilder = [];

            if (tokens.length) {
                var wrapLimit = self.editor.ace.session.getWrapLimit();
                var tabSize = self.editor.ace.session.getTabSize();
                var displayTokens = self.editor.ace.session.$getDisplayTokens(row_text);
                var splits = self.editor.ace.session.$computeWrapSplits(displayTokens, wrapLimit, tabSize);
                if (splits && splits.length)
                    self.editor.ace.renderer.$textLayer.$renderWrappedLine(stringBuilder, tokens, splits, false);
                else
                    self.editor.ace.renderer.$textLayer.$renderSimpleLine(stringBuilder, tokens);

                stringBuilder.unshift(
                    "<div class='ace_line' style='height:",
                    self.editor.ace.renderer.$textLayer.config.lineHeight, "px'>"
                );
                stringBuilder.unshift("<div class='ace_line_group' style='height:",
                    self.editor.ace.renderer.$textLayer.config.lineHeight * (splits.length+1), "px'>");
            }
            stringBuilder.push("</div>", "</div>");
            return stringBuilder.join("");
        };
        self._calculateDiff = function() {
            /**
             * returns a list of lines that differ between the template and the original document
             * makes use of codility's diff library (diff.js)
             * as a side effect, cache current version of template and template_lines
             *
             */
            var diff = {};
            var template = self.editor.template;
            var value = self.editor.getValue();
            if (template) {
                var template_lines = Diff.splitLines(template);
                var value_lines = Diff.splitLines(value);
                var linesLength = Math.max(template_lines.length, value_lines.length);
                for (var i = 0; i < linesLength; i++) {
                    if (template_lines[i] !== value_lines[i]) {
                        diff[i] = true;
                    }
                }
                //compare with previous template, update array of template strings
                if (template !== self.template) {
                    self.template = template;
                    self.template_lines = template_lines;
                }
            }
            return diff;
        };
        return self;
    };
});