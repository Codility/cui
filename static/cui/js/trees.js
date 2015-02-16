
var Trees = (function() {
    var self = {};

    var TOKEN_TYPES = [
        { regex: /^\(/ },
        { regex: /^\)/ },
        { regex: /^,/ },
        { regex: /^None/ },
        { regex: /^-?\d+/, convert: function(s) { return parseInt(s, 10); } }
    ];

    self.tokenize = function(input) {
        var tokens = [];

        while (input !== '') {
            input = input.replace(/^\s+/, '');

            if (input === '')
                break;

            var token = null;
            for (var i = 0; i < TOKEN_TYPES.length; i++) {
                var m = TOKEN_TYPES[i].regex.exec(input);
                if (m) {
                    input = input.substr(m[0].length);
                    token = m[0];
                    if (TOKEN_TYPES[i].convert) {
                        token = TOKEN_TYPES[i].convert(token);
                    }
                    break;
                }
            }

            if (token === null)
                throw new Error('unexpected input: ' + input);

            tokens.push(token);
        }

        return tokens;
    };

    self.parse_tree = function(input) {
        var tokens = self.tokenize(input);

        if (tokens.length === 0)
            return { empty: true };

        var t = read_tree();
        end();
        return t;

        function read_tree() {
            if (tokens.length === 0)
                error_parsing('tree');

            if (tokens[0] === 'None') {
                read('None');
                return { empty: true };
            } else if (tokens[0] === '(') {
                read('(');
                var val = read_int();
                read(',');
                var l = read_tree();
                read(',');
                var r = read_tree();
                read(')');
                return { val: val, l: l, r: r };
            } else {
                error_parsing('tree');
            }
        }

        function read_int() {
            if (tokens.length === 0 || typeof tokens[0] !== 'number')
                error_parsing('integer');
            return tokens.shift();
        }

        function read(expected_token) {
            if (tokens.length === 0 || tokens[0] !== expected_token)
                error_parsing("'" + expected_token + "'");
            return tokens.shift();
        }

        function end() {
            if (tokens.length > 0)
                error_parsing('end of input');
        }

        function error_parsing(what) {
            throw new Error('unexpected ' + (tokens.length > 0 ? "'"+tokens[0]+"'" : 'end of input') +
                            ', required ' + what);
        }
    };

    self.serialize_tree = function(tree) {
        if (tree.empty)
            return 'None';
        else
            return ('(' + tree.val + ', ' +
                    self.serialize_tree(tree.l) + ', ' +
                    self.serialize_tree(tree.r) + ')');
    };

    return self;
})();

var SVG = (function() {
    var self = {};

    var svgNS = "http://www.w3.org/2000/svg";
    self.create = function(name, attributes, content) {
        var elt = document.createElementNS(svgNS, name);
        self.update(elt, attributes, content);
        return elt;
    };

    self.add = function(container, name, attributes, content) {
        var elt = self.create(name, attributes, content);
        container.appendChild(elt);
        return elt;
    };

    self.clear = function(container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    };

    self.update = function(elt, attributes, content) {
        for (var key in attributes) {
            elt.setAttributeNS(null, key, attributes[key]);
        }
        if (content !== undefined) {
            self.clear(elt);
            elt.appendChild(document.createTextNode(content));
        }
    };

    self.update_selector = function(container, selector, attributes, content) {
        var elt = container.querySelector(selector);
        self.update(elt, attributes, content);
    };

    return self;
})();


var TreeDimensions = {
    NODE_WIDTH: 30,
    EMPTY_WIDTH: 5,
    NODE_HEIGHT: 50,
    EMPTY_HEIGHT: 25,
    EMPTY_SIZE: 10
};

var TreeEditor = function($elt) {
    var self = {};

    self.init = function() {
        self.$elt = $elt;
        self.$elt.addClass('tree-editor');
        self.tree = { empty: true };

        self.svg = SVG.create("svg");
        $elt.append(self.svg);

        self.main = SVG.add(self.svg, 'g', {'class': 'tree-editor-main'});
    };

    self.set_tree = function(tree) {
        self.tree = tree;
        self.redraw_tree();
    };

    self.clear = function() {
        SVG.clear(self.main);
    };

    // TODO calc the dimensions properly instead of hard-coding
    self.redraw_tree = function() {
        self.calc_dimensions(self.tree);
        self.calc_positions(self.tree, 25, -TreeDimensions.NODE_HEIGHT + 30);

        var width = self.tree.width + 50;
        var height = self.tree.height;

        SVG.update(self.svg, {width: width, height: height});

        self.draw_tree(self.main, self.tree);
    };

    self.calc_dimensions = function(tree) {
        if (tree.empty) {
            tree.node_width = TreeDimensions.EMPTY_WIDTH;
            tree.width = TreeDimensions.EMPTY_WIDTH;
            tree.height = TreeDimensions.EMPTY_HEIGHT;
        } else {
            self.calc_dimensions(tree.l);
            self.calc_dimensions(tree.r);

            tree.node_width = self.get_node_width(tree.val);
            tree.width = tree.l.width + tree.r.width + tree.node_width;
            tree.height = TreeDimensions.NODE_HEIGHT + Math.max(tree.l.height, tree.r.height);
        }
    };

    self.calc_positions = function(tree, x, y) {
        if (tree.empty) {
            tree.x = x + TreeDimensions.EMPTY_WIDTH / 2;
            tree.y = y + TreeDimensions.EMPTY_HEIGHT;
        } else {
            tree.x = x + tree.l.width + tree.node_width / 2;
            tree.y = y + TreeDimensions.NODE_HEIGHT;

            self.calc_positions(tree.l, x, tree.y);
            self.calc_positions(tree.r, x + tree.l.width + tree.node_width, tree.y);
        }
    };

    self.get_node_width = function(value) {
        return Math.max(TreeDimensions.NODE_WIDTH, self.get_text_width(value) + 10);
    };

    self.draw_tree = function(container, tree, parent) {
        function remove(name) {
            if (tree[name]) {
                tree[name].remove();
                tree[name] = null;
            }
        }

        if (tree.empty) {
            remove('tree_part');

            if (!tree.empty_tree_part) {
                tree.empty_tree_part = EmptyTreePart(container, tree, parent);
                tree.empty_tree_part.node_elt.onclick = function() {
                    tree.empty = false;
                    tree.val = 1;
                    tree.l = { empty: true };
                    tree.r = { empty: true };
                    self.redraw_tree();
                };
            }

            tree.empty_tree_part.update();
        } else {
            remove('empty_tree_part');

            if (!tree.tree_part) {
                tree.tree_part = NonEmptyTreePart(container, tree, parent);
                if (parent) {
                    tree.tree_part.onclick = function() {
                        tree.empty = true;
                        self.redraw_tree();
                    };
                }
                tree.tree_part.node_elt.onclick = function() {
                        self.make_editable(tree);
                };
            }

            tree.tree_part.update();

            self.draw_tree(tree.tree_part.children_elt, tree.l, tree);
            self.draw_tree(tree.tree_part.children_elt, tree.r, tree);
        }
    };

    self.make_editable = function(tree) {
        var $input = $('<input>').attr('maxlength', 11).val(tree.val);
        var width = Math.max(self.get_node_width(tree.val), 76);
        $input.css({
            position: 'absolute',
            left: tree.x + 'px',
            top: tree.y + 'px',
            width: width + 'px',
            'margin-left': -width/2 + 'px'
        });
        self.$elt.append($input);
        $input.focus();
        $input.select();

        function get_value(s) {
            if (!/^[+-]?(0|[1-9]\d{0,9})$/.test(s))
                return null;
            var n = parseInt(s, 10);
            if (!(-2147483648 <= n && n <= 2147483647))
                return null;
            return n;
        }

        function exit() {
            var val = get_value($input.val());
            // TODO: if we change the value (which triggers a redraw),
            // and the user clicks another node at the same time,
            // we lose the event.
            // We could, for instance, re-use the elements while redrawing.
            if (val !== null && val !== tree.val) {
                tree.val = val;
                self.redraw_tree();
            }
            $input.remove();
        }

        $input.on('change keyup paste', function() {
            if (get_value($input.val()) === null)
                $input.addClass('error');
            else
                $input.removeClass('error');
        });

        $input.on('keypress', function(e) {
            if (e.which == 13) // enter
                exit();
        });

        $input.on('blur', exit);
    };

    // HACK
    self.get_text_width = function(content) {
        var elt = SVG.add(self.main, 'text', {}, content);
        var width = elt.getBoundingClientRect().width;
        self.main.removeChild(elt);
        return width;
    };

    self.init();

    return self;
};

var Part = function(container, class_name) {
    var self = {};

    self.group_elt = SVG.add(container, 'g', {'class': class_name});

    self.remove = function() {
        container.removeChild(self.group_elt);
    };
    return self;
};

var EmptyTreePart = function(container, tree, parent) {
    var self = Part(container, 'empty-tree');

    if (parent)
        self.edge_elt = SVG.add(self.group_elt, 'line', { 'class': 'empty-edge', stroke: 'black'});

    self.node_elt = SVG.add(self.group_elt, 'rect', {
        'class': 'empty',
        width: TreeDimensions.EMPTY_SIZE, height: TreeDimensions.EMPTY_SIZE
    });

    self.update = function() {
        if (parent)
            SVG.update(self.edge_elt, {x1: parent.x, y1: parent.y, x2: tree.x, y2: tree.y});
        SVG.update(self.node_elt, {x: tree.x - TreeDimensions.EMPTY_SIZE/2,
                                   y: tree.y - TreeDimensions.EMPTY_SIZE/2});
    };
    return self;
};

var NonEmptyTreePart = function(container, tree, parent) {
    var self = Part(container, 'tree');

    if (parent) {
        self.edge_elt = SVG.add(self.group_elt, 'g', { 'class': 'edge' });
        self.thick_elt = SVG.add(self.edge_elt, 'line', { 'class': 'thick' });
        self.thin_elt = SVG.add(self.edge_elt, 'line', { 'class': 'thin' });
    }

    self.children_elt = SVG.add(self.group_elt, 'g', { 'class': 'children' });

    self.node_elt = SVG.add(self.group_elt, 'g', { 'class': 'node' });
    self.rect_elt = SVG.add(self.node_elt, 'rect',
                            {height: TreeDimensions.NODE_WIDTH,
                             rx: TreeDimensions.NODE_WIDTH/2, ry: TreeDimensions.NODE_WIDTH/2,
                             stroke: 'black', fill: 'white'});
    self.text_elt = SVG.add(self.node_elt, 'text',
                            { style: 'text-anchor: middle;'});

    self.update = function () {
        if (parent) {
            SVG.update(self.thick_elt, { x1: parent.x, y1: parent.y, x2: tree.x, y2: tree.y });
            SVG.update(self.thin_elt, { x1: parent.x, y1: parent.y, x2: tree.x, y2: tree.y });
        }

        SVG.update(self.rect_elt,
                   {x: tree.x-tree.node_width/2, y: tree.y-TreeDimensions.NODE_WIDTH/2,
                    width: tree.node_width});
        // HACK: vertical alignment is hardcoded, because
        // IE doesn't support 'dominant-baseline: central'.
        SVG.update(self.text_elt, {
            x: tree.x, y: tree.y + 5,
        }, tree.val);
    };

    return self;
};
