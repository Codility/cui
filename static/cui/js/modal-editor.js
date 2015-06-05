
/* global Console, InputData, TreeEditor, IntEditor */

function ModalEditor($elt, input_string, on_ok, on_cancel, options) {
    var self = {};

    self.options = options;
    self.format = self.options.format;

    self.read_tuple = function() {
        try {
            return InputData.parse_tuple(input_string, self.format);
        } catch (e) {
            Console.clear();
            Console.msg_error('Could not parse the test case: ' + e.message);
            return null;
        }
    };

    self.init = function() {
        var tuple = self.read_tuple();
        if (tuple === null)
            return;

        self.editors = {};

        for (var i = 0; i < self.format.length; i++) {
            self.create_editor_for_param(self.format[i], tuple);
        }

        $elt.find('.ok').click(self.handle_ok);
        $elt.find('.cancel').click(self.handle_cancel);

        Console.clear(); // wipe any past parse errors
        $elt.jqmShow();

        // HACK: text width is not computed correctly before the modal
        // is shown
        if (self.tree_editor)
            self.tree_editor.update_tree();
    };

    self.destroy_modal = function() {
        $elt.jqmHide();
        $elt.find('.ok').unbind('click');
        $elt.find('.cancel').unbind('click');
        $elt.find('.params').empty();

        if (self.tree_editor)
            self.tree_editor.destroy();
    };

    self.get_tuple_string = function() {
        var tuple = {};
        for (var i = 0; i < self.format.length; i++) {
            var value = self.editors[self.format[i].name].get_value();
            if (value === null && self.format[i].type == 'int') {
                Console.msg_error('Invalid value for parameter ' + self.format[i].name + ', using 0.');
                value = 0;
            }
            tuple[self.format[i].name] = value;
        }
        return InputData.serialize_tuple(tuple, self.format);
    };

    self.create_editor_for_param = function(param, tuple) {
        var editor;
        if (param.type == 'tree') {
            if (self.tree_editor)
                throw new Error('Only one tree is currently supported');

            editor = TreeEditor($elt.find('.tree-editor'),
                                $elt.find('.undo'),
                                $elt.find('.warnings'));
            editor.set_tree(tuple[param.name]);
            if (self.options.bst)
                editor.enable_bst_warning();

            self.tree_editor = editor;
        } else if (param.type == 'int') {
            var $param = $('<div class="param"><span class="name"></span> = <input type="text"></input></div>');
            $param.find('.name').text(param.name);
            // note we use ints only, so no need to deserialize
            $param.find('input').val(tuple[param.name]);
            $param.attr('data-name', param.name);
            editor = IntEditor($param.find('input'));
            $elt.find('.params').append($param);
        }
        self.editors[param.name] = editor;
    };

    self.handle_ok = function(e) {
        e.preventDefault();
        var tuple_string = self.get_tuple_string();
        self.destroy_modal();
        on_ok(tuple_string);
    };

    self.handle_cancel = function(e) {
        e.preventDefault();
        self.destroy_modal();
        on_cancel();
    };

    self.init();

    return self;
}
