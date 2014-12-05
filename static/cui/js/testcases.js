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
/* global ui */
var TestCases = {
    limit : 5,

    init : function() {
        this.nextID = 0;
        this.count = 0;

        $('#add_test_case').click(function(e) {
            e.preventDefault();
            TestCases.add();
        });
    },

    add : function(value) {
        Log.info("candidate add test case");
        value = value || $('input[name=test_case_example]').val();
        var num = this.nextID;
        this.nextID++;
        this.count++;

        if (this.limitReached())
            $('#add_test_case').hide();

        var $test_case = $(
            '<div id="test_data'+num+'" class="test-case">' +
                '<div class="left"><span class="number">' + num + '.</span>' +
                '<span class="remove">-</span></div>' +
                '<div class="right"><input name="test_data[]"></input></div>'+
            '</div>');
        var $input = $test_case.find('input');
        $input.val('[1, 2, 3, 4]');

        $('#test_cases').append($test_case);
        $test_case.find('a').click(function(e) {
            e.preventDefault();
            TestCases.remove(num);
        });
        ui.updatePageLayout();
    },

    remove : function(num) {
        if ($("#test_data"+num).length === 0) {
            return;
        }
        this.count--;

        if (this.count < this.limit)
            $('#add_test_case').show();

        Log.info("candidate remove test case", "test case num=" + num);
        $('#test_data'+num).remove();
        if (this.count === 0) {
            $('#test_data_help').remove();
        }
        ui.updatePageLayout();
    },

    removeAll : function() {
        for (var i = 0; i < this.nextID; i++) {
            this.remove(i);
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
