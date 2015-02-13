
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
            return null;

        var t = read_tree();
        end();
        return t;

        function read_tree() {
            if (tokens.length === 0)
                error_parsing('tree');

            if (tokens[0] === 'None') {
                read('None');
                return null;
            } else if (tokens[0] === '(') {
                read('(');
                var x = read_int();
                read(',');
                var l = read_tree();
                read(',');
                var r = read_tree();
                read(')');
                return { x: x, l: l, r: r };
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
        if (tree === null)
            return 'None';
        else
            return ('(' + tree.x + ', ' +
                    self.serialize_tree(tree.l) + ', ' +
                    self.serialize_tree(tree.r) + ')');
    };

    return self;
})();


var TreeEditor = function($elt, tree_string) {
    var self = {};

    var svgNS = "http://www.w3.org/2000/svg";
    var node_width = 30;
    var null_width = 5;
    var node_height = 50;
    var null_height = 25;
    var null_size = 10;

    self.init = function() {
        self.$elt = $elt;
        self.tree = Trees.parse_tree(tree_string);

        self.svg = document.createElementNS(svgNS, "svg");
        self.svg.setAttributeNS(null, 'width', 500);
        self.svg.setAttributeNS(null, 'height', 500);

        $elt.append(self.svg);

        var width = self.get_width(self.tree);
        var x = (500 - width) / 2;
        var y = 0;
        self.draw_tree(self.tree, x, y);
    };

    self.get_width = function(tree) {
        if (tree === null)
            return null_width;

        if (tree.width !== undefined)
            return tree.width;

        var left_width = self.get_width(tree.l);
        var right_width = self.get_width(tree.r);

        tree.width = left_width + right_width + node_width;
        return tree.width;
    };

    self.draw_tree = function(tree, x, y, parent_x) {
        var root_x, root_y;
        if (tree === null) {
            root_x = x + null_width / 2;
            root_y = y + null_height;

            if (parent_x !== undefined)
                self.draw_edge(parent_x, y, root_x, root_y);

            self.draw_null(root_x, root_y);
            return;
        }

        var left_width = self.get_width(tree.l);
        root_x = x + left_width + node_width / 2;
        root_y = y + node_height;

        if (parent_x !== undefined)
            self.draw_edge(parent_x, y, root_x, root_y);

        self.draw_tree(tree.l, x, root_y, root_x);
        self.draw_tree(tree.r, x + left_width + node_width, root_y, root_x);

        self.draw_node(tree.x, root_x, root_y);
   };

    self.draw_node = function(value, x, y) {
        self.add_element('circle', {cx: x, cy: y, r: node_width/2, stroke: 'black', fill: 'white'});
        self.add_element('text', {x: x, y: y, style: 'text-anchor: middle; dominant-baseline: central;'}, value);
    };

    self.draw_edge = function(x1, y1, x2, y2) {
        self.add_element('line', {x1: x1, y1: y1, x2: x2, y2: y2, stroke: 'black'});
    };

    self.draw_null = function(x, y) {
        self.add_element('rect', {x: x-null_size/2, y: y-null_size/2, width: null_size, height: null_size, fill: 'black'});
    };

    self.add_element = function(name, attributes, content) {
        var elt = document.createElementNS(svgNS, name);

        for (var key in attributes) {
            elt.setAttributeNS(null, key, attributes[key]);
        }

        if (content !== undefined) {
            elt.appendChild(document.createTextNode(content));
        }

        self.svg.appendChild(elt);
    };

    self.init();

    return self;
};
