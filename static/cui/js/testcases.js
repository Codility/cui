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
    focus : false,
    format : '',

    init : function() {
        this.nextID = 0;
        this.count = 0;

        $('#add_test_case').click(function(e) {
            e.preventDefault();
            TestCases.add();
        });

        this.update();
    },

    update: function() {
        $('#add_test_case .counter').text(this.count + '/' + this.limit);
        if (this.count >= this.limit) {
            $('#add_test_case').addClass('limit-reached');
        } else {
            $('#add_test_case').removeClass('limit-reached');
        }

        var value = $('input[name=test_case_example]').val() || '';
        var format = 'format: ' + value;

        // Hack: truncate the test case string,
        // assuming hard-coded font width
        var width = $('#add_test_case .wide').width();
        var font_width = 8;
        if (format.length > width / font_width) {
            var length = Math.floor(width / font_width);
            format = format.slice (0, length - 1) + '\u2026'; // ellipsis
        }
	$('#add_test_case .case-format').text(format);
    },

    onChangeFocus: function(newFocus) {
        var $title = $('#add_test_case .title');
        var $format = $('#add_test_case .case-format');

        var that = this;
        function transition($from, $to, requiredFocus) {
            setTimeout(function() {
                if (that.focus != requiredFocus)
                    return;
                if ($to.is(':visible'))
                    return;
                $from.fadeOut(200, function() { $to.fadeIn(200); });
            }, 500);
            that.focus = requiredFocus;
        }

        if (!this.focus && newFocus) {
            transition($title, $format, true);
        } else if (this.focus && !newFocus) {
            transition($format, $title, false);
        }
    },

    add : function(value) {
        if (this.count >= this.limit)
            return;

        Log.info("candidate add test case");

        var num = this.nextID;
        this.nextID++;
        this.count++;

        var $test_case = $('#example_test_case').clone();
        $test_case.prop('id', 'test_data'+num);

        $('#test_cases').append($test_case);
        $test_case.find('.remove').click(function(e) {
            e.preventDefault();
            TestCases.remove(num);
        });

        var $input = $test_case.find('input');

        var that = this;
        $input.focus(function() { that.onChangeFocus(true); });
        $input.blur(function() { that.onChangeFocus(false); });

        this.update();
        ui.updatePageLayout();

        $input.focus();
    },

    remove : function(num) {
        if ($("#test_data"+num).length === 0) {
            return;
        }
        this.count--;

        Log.info("candidate remove test case", "test case num=" + num);
        $('#test_data'+num).remove();
        this.update();
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
};
