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

        if (this.count == 1) {
            var help_text = '<div id="test_data_help"><small style="float:left">' +
                    'include your own test data and use it for testing return values.</small></div>';
            $('#test_cases').append(help_text);
        }

        var $test_case = $(
            '<div id="test_data'+num+'" class="testCase">' +
            '<a style="float:right" href="#">remove</a>' +
            '<div class="clr"></div>' +
            '<textarea name="test_data[]" rows=2 cols=50></textarea>'+
            '</div>');
        var $textarea = $test_case.find('textarea');
        $textarea.val(value);

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
