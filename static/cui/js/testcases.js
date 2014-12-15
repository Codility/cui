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

/* global Log */
/* global Console, ui */
var TestCases = {
    limit : 5,

    init : function() {
        this.count = 0;

        $('#add_test_case').click(function(e) {
            e.preventDefault();
            TestCases.add();
        });
    },

    add : function(value) {
        Log.info("candidate add test case");
        value = value || $('input[name=test_case_example]').val();
        this.count++;

        if (this.limitReached())
            $('#add_test_case').hide();

        if (this.count == 1) {
            var help_text = '<div id="test_data_help"><small style="float:left">' +
                    'include your own test data and use it for testing return values.</small></div>';
            $('#test_cases').append(help_text);
        }

        var $test_case = $(
            '<div class="testCase">' +
            '<a style="float:right" href="#">remove</a>' +
            '<div class="clr"></div>' +
            '<textarea name="test_data[]" rows=2 cols=50></textarea>'+
            '</div>');
        var $textarea = $test_case.find('textarea');
        $textarea.val(value);

        $('#test_cases').append($test_case);
        $test_case.find('a').click(function(e) {
            e.preventDefault();
            TestCases.remove($(this).closest('.testCase'));
        });
        ui.updatePageLayout();
    },

    clean : function() {
        $('.testCase').each(function(i, tc) {
            var value = $(tc).find('textarea').val();

            // Replace unicode minus, found in task descriptions.
            var value_clean = value.replace('\u2212', '-');
            // Strip all other non-ASCII characters.
            value_clean = value_clean.replace(/[^\x20-\x7f]/g, '');
            if (value !== value_clean){
                $(tc).find('textarea').val(value_clean);
                Console.msg(value +" was changed to " + value_clean + ". (Illegal Characters removed.)");
            }
        });
    },

    get_list : function() {
        var test_list = [];
        $('.testCase').each(function(i, tc) {
            var value = $(tc).find('textarea').val();
            test_list.push(value);
        });
        return test_list;
    },

    remove : function($elt) {
        this.count--;

        if (this.count < this.limit)
            $('#add_test_case').show();

        Log.info("candidate remove test case");
        $elt.remove();
        if (this.count === 0) {
            $('#test_data_help').remove();
        }
        ui.updatePageLayout();
    },

    removeAll : function() {
        this.count = 0;
        $('.testCase').remove();
        $('#add_test_case').show();
        $('#test_data_help').remove();
        ui.updatePageLayout();
    },

    save : function(ticket_id, task_name) {
        if (!window.localStorage)
            return;

        var test_list_json = JSON.stringify(this.get_list());
        window.localStorage.setItem('test_cases_'+ticket_id+'_'+task_name, test_list_json);
    },

    load : function(ticket_id, task_name) {
        if (!window.localStorage)
            return;

        var test_list_json = window.localStorage.getItem('test_cases_'+ticket_id+'_'+task_name);
        if (!test_list_json)
            return;

        try {
            var test_list = $.parseJSON(test_list_json);
            this.removeAll();
            for (var i = 0; i < test_list.length; i++)
                this.add(test_list[i]);
        } catch(e) {
            Log.error('error loading test cases', e);
        }
    },

    disable : function() {
        $('#add_test_case').hide();
        ui.updatePageLayout();
    },

    enable : function() {
        $("#add_test_case").show();
        ui.updatePageLayout();
    },

    limitReached : function(){
        return this.count >= this.limit;
    }

};
