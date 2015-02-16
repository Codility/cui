
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


var TreeEditor = function($elt) {
    var self = {};


    var node_width = 30;
    var empty_width = 5;
    var node_height = 50;
    var empty_height = 25;
    var empty_size = 10;

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
        self.calc_positions(self.tree, 25, -node_height + 30);

        var width = self.tree.width + 50;
        var height = self.tree.height;

        SVG.update(self.svg, {width: width, height: height});

        self.clear();
        self.draw_tree(self.main, self.tree);
    };

    self.calc_dimensions = function(tree) {
        if (tree.empty) {
            tree.node_width = empty_width;
            tree.width = empty_width;
            tree.height = empty_height;
        } else {
            self.calc_dimensions(tree.l);
            self.calc_dimensions(tree.r);

            tree.node_width = self.get_node_width(tree.val);
            tree.width = tree.l.width + tree.r.width + tree.node_width;
            tree.height = node_height + Math.max(tree.l.height, tree.r.height);
        }
    };

    self.calc_positions = function(tree, x, y) {
        if (tree.empty) {
            tree.x = x + empty_width / 2;
            tree.y = y + empty_height;
        } else {
            tree.x = x + tree.l.width + tree.node_width / 2;
            tree.y = y + node_height;

            self.calc_positions(tree.l, x, tree.y);
            self.calc_positions(tree.r, x + tree.l.width + tree.node_width, tree.y);
        }
    };

    self.get_node_width = function(value) {
        return Math.max(node_width, self.get_text_width(value) + 10);
    };

    self.draw_tree = function(container, tree, parent) {
        function remove(name) {
            if (tree[name]) {
                container.removeChild(tree[name]);
                tree[name] = null;
            }
        }

        if (tree.empty) {
            remove('tree_elt');

            if (!tree.empty_tree_elt) {
                tree.empty_tree_elt = SVG.add(container, 'g', {'class': 'empty-tree'});
                if (parent) {
                    self.draw_empty_edge(tree.empty_tree_elt);
                }
                var empty_elt = self.draw_empty(tree.empty_tree_elt);
                empty_elt.onclick = function() {
                    tree.empty = false;
                    tree.val = 1;
                    tree.l = { empty: true };
                    tree.r = { empty: true };
                    self.redraw_tree();
                };
            }

            if (parent) {
                self.update_empty_edge(tree.empty_tree_elt, parent.x, parent.y, tree.x, tree.y);
            }

            self.update_empty(tree.empty_tree_elt, tree.x, tree.y);
        } else {
            remove('empty_tree_elt');

            var creating = !tree.tree_elt;

            if (creating) {
                tree.tree_elt = SVG.add(container, 'g', {'class': 'tree'});
                if (parent) {
                    var edge_elt = self.draw_edge(tree.tree_elt);
                    edge_elt.onclick = function() {
                        tree.empty = true;
                        self.redraw_tree();
                    };
                }
            }

            if (creating) {
                var node_elt = self.draw_node(tree.tree_elt);
                node_elt.onclick = function() {
                    self.make_editable(tree);
                };
            }

            if (parent) {
                self.update_edge(tree.tree_elt, parent.x, parent.y, tree.x, tree.y);
            }

            self.update_node(tree.tree_elt, tree.val, tree.x, tree.y);
            self.draw_tree(tree.tree_elt, tree.l, tree);
            self.draw_tree(tree.tree_elt, tree.r, tree);

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

    self.draw_node = function(container) {
        var g = SVG.add(container, 'g', { 'class': 'node' });
        SVG.add(g, 'rect',
                {height: node_width,
                 rx: node_width/2, ry: node_width/2,
                 stroke: 'black', fill: 'white'});
        SVG.add(g, 'text',
                { style: 'text-anchor: middle;'});
        return g;
    };

    self.update_node = function(container, value, x, y) {
        var width = self.get_node_width(value);
        SVG.update_selector(container, '.node rect',
                            {x: x-width/2, y: y-node_width/2,
                             width: width});
        // HACK: vertical alignment is hardcoded, because
        // IE doesn't support 'dominant-baseline: central'.
        SVG.update_selector(container, '.node text', {
                                x: x, y: y + 5,
                            }, value);
    };

    self.draw_empty_edge = function(container) {
        return SVG.add(container, 'line', { 'class': 'empty-edge', stroke: 'black'});
    };

    self.update_empty_edge = function(container, x1, y1, x2, y2) {
        SVG.update_selector(container, '.empty-edge', { x1: x1, y1: y1, x2: x2, y2: y2 });
    };

    self.draw_edge = function(container) {
        var g = SVG.add(container, 'g', { 'class': 'edge' });
        SVG.add(g, 'line', { 'class': 'thick' });
        SVG.add(g, 'line', { 'class': 'thin' });
        return g;
    };

    self.update_edge = function(container, x1, y1, x2, y2) {
        SVG.update_selector(container, '.edge .thick', { x1: x1, y1: y1, x2: x2, y2: y2 });
        SVG.update_selector(container, '.edge .thin', { x1: x1, y1: y1, x2: x2, y2: y2 });
    };

    self.draw_empty = function(container) {
        return SVG.add(container, 'rect', {
            'class': 'empty',
            width: empty_size, height: empty_size
        });
    };

    self.update_empty = function(container, x, y) {
        SVG.update_selector(container, '.empty', {
            x: x-empty_size/2, y: y-empty_size/2
        });
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
