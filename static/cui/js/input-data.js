
var InputData = (function() {
    var InputData = {};

    InputData.escape_string = function(string) {
        return '"' + string.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"') + '"';
    };

    InputData.unescape_string = function(literal) {
        return literal.slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    };

    var TOKEN_TYPES = [
        { regex: /^\(/, type: 'symbol' },
        { regex: /^\)/, type: 'symbol' },
        { regex: /^,/, type: 'symbol' },
        { regex: /^None/, type: 'symbol' },
        {
            regex: /^[+-]?(0|[1-9]\d{0,9})/,
            type: 'int',
            convert: function(s) { return parseInt(s, 10); }
        },
        {
            regex: /^"(\\"|[^"])*"/,
            type: 'string',
            convert: InputData.unescape_string
        }
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
                    token = { type: TOKEN_TYPES[i].type, value: m[0] };
                    if (TOKEN_TYPES[i].convert) {
                        token.value = TOKEN_TYPES[i].convert(token.value);
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

            if (self.tokens[0].type === 'symbol' && self.tokens[0].value === 'None') {
                self.read('symbol', 'None');
                return { empty: true };
            } else if (self.tokens[0].type === 'symbol' && self.tokens[0].value === '(') {
                self.read('symbol', '(');
                var val = self.read_int();
                self.read('symbol', ',');
                var l = self.read_tree();
                self.read('symbol', ',');
                var r = self.read_tree();
                self.read('symbol', ')');
                return { val: val, l: l, r: r };
            } else {
                self.error_parsing('tree');
            }
        };

        self.read_int = function() {
            if (self.tokens.length === 0 || self.tokens[0].type !== 'int')
                self.error_parsing('integer');
            return self.tokens.shift().value;
        };

        self.read_string = function() {
            if (self.tokens.length === 0 || self.tokens[0].type !== 'string')
                self.error_parsing('string');
            return self.tokens.shift().value;
        };

        self.read = function(expected_type, expected_value) {
            if (self.tokens.length === 0 ||
                self.tokens[0].type !== expected_type ||
                self.tokens[0].value !== expected_value)
                self.error_parsing("'" + expected_value + "'");
            return self.tokens.shift().value;
        };

        self.end = function() {
            if (self.tokens.length > 0)
                self.error_parsing('end of input');
        };

        self.error_parsing = function(what) {
            throw new Error('unexpected ' + (self.tokens.length > 0 ? "'"+self.tokens[0].value+"'" : 'end of input') +
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
            parser.read('symbol', '(');
        for (var i = 0; i < format.length; i++) {
            if (i > 0)
                parser.read('symbol', ',');

            var val;
            if (format[i].type == 'tree')
                val = parser.read_tree();
            else if (format[i].type == 'string')
                val = parser.read_string();
            else if (format[i].type == 'int')
                val = parser.read_int();
            else
                throw new Error('unrecognized type: ' + format[i].type);

            result[format[i].name] = val;
        }
        if (use_parens)
            parser.read('symbol', ')');
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
            else if (format[i].type == 'string')
                str = InputData.escape_string(data);
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
