
var InputData = (function() {
    var InputData = {};

    var TOKEN_TYPES = [
        { regex: /^\(/ },
        { regex: /^\)/ },
        { regex: /^,/ },
        { regex: /^None/ },
        { regex: /^[+-]?(0|[1-9]\d{0,9})/, convert: function(s) { return parseInt(s, 10); } }
    ];

    InputData.tokenize = function(input) {
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

            if (token === null) {
                var s = input;
                if (s.length > 10)
                    s = s.substr(0, 10) + '...';
                throw new Error('unexpected input near \'' + s + '\'');
            }

            tokens.push(token);
        }

        return tokens;
    };

    InputData.Parser = function(input) {
        var self = {};
        self.tokens = InputData.tokenize(input);

        self.is_empty = function() {
            return self.tokens.length === 0;
        };

        self.read_tree = function() {
            if (self.tokens.length === 0)
                self.error_parsing('tree');

            if (self.tokens[0] === 'None') {
                self.read('None');
                return { empty: true };
            } else if (self.tokens[0] === '(') {
                self.read('(');
                var val = self.read_int();
                self.read(',');
                var l = self.read_tree();
                self.read(',');
                var r = self.read_tree();
                self.read(')');
                return { val: val, l: l, r: r };
            } else {
                self.error_parsing('tree');
            }
        };

        self.read_int = function() {
            if (self.tokens.length === 0 || typeof self.tokens[0] !== 'number')
                self.error_parsing('integer');
            return self.tokens.shift();
        };

        self.read = function(expected_token) {
            if (self.tokens.length === 0 || self.tokens[0] !== expected_token)
                self.error_parsing("'" + expected_token + "'");
            return self.tokens.shift();
        };

        self.end = function() {
            if (self.tokens.length > 0)
                self.error_parsing('end of input');
        };

        self.error_parsing = function(what) {
            throw new Error('unexpected ' + (self.tokens.length > 0 ? "'"+self.tokens[0]+"'" : 'end of input') +
                            ', required ' + what);
        };

        return self;
    };

    InputData.parse_tree = function(input) {
        var parser = InputData.Parser(input);

        if (parser.is_empty())
            return { empty: true };

        var t = parser.read_tree();
        parser.end();
        return t;
    };

    InputData.parse_tuple = function(input, format) {
        var parser = InputData.Parser(input);
        var result = {};

        var use_parens = format.length != 1;
        if (use_parens)
            parser.read('(');
        for (var i = 0; i < format.length; i++) {
            if (i > 0)
                parser.read(',');

            var val;
            if (format[i].type == 'tree')
                val = parser.read_tree();
            else if (format[i].type == 'int')
                val = parser.read_int();
            else
                throw new Error('unrecognized type: ' + format[i].type);

            result[format[i].name] = val;
        }
        if (use_parens)
            parser.read(')');
        parser.end();
        return result;
    };

    InputData.serialize_tree = function(tree) {
        if (tree.empty)
            return 'None';
        else
            return ('(' + tree.val + ', ' +
                    InputData.serialize_tree(tree.l) + ', ' +
                    InputData.serialize_tree(tree.r) + ')');
    };

    InputData.serialize_tuple = function(tuple, format) {
        var result = [];

        for (var i = 0; i < format.length; i++) {
            var data = tuple[format[i].name];

            var str;
            if (format[i].type == 'tree')
                str = InputData.serialize_tree(data);
            else if (format[i].type == 'int')
                str = data.toString();
            else
                throw new Error('unrecognized type: ' + format[i].type);

            result.push(str);
        }
        if (format.length == 1)
            return result[0];
        return '(' + result.join(", ") + ')';
    };

    return InputData;
})();
