var parseScheem;

if (typeof module !== 'undefined') {
    var PEG = require('pegjs');
    var fs = require('fs');

    parseScheem = PEG.buildParser(fs.readFileSync('scheem.peg', 'utf-8')).parse;
}
else {
    parseScheem = scheem.parse;
};

var evalScheemString = function (string, env) {
    return evalScheem(parseScheem(string), env || {});
};

var isArray = function (obj) {
	return obj && obj instanceof Array;
};

var evalScheem = function (expr, env) {
    // Special error token
	if (expr === 'error') throw('Error');

    // Numbers evaluate to themselves
    if (typeof expr === 'number') {
        return expr;
    }

    // Strings are variable references
    if (typeof expr === 'string') {
        return env[expr];
    }

    var len = expr.length,
	    tmp;
    
    // Look at head of list for operation
    switch (expr[0]) {
        case '+':
			if (len == 1) throw('Incorrect number of arguments');
			tmp = 0;
			for (var i = 1; i < len; ++i) {
				tmp += +evalScheem(expr[i], env);
			}
            return tmp;

        case '-':
			if (len > 3 || len < 2) throw('Incorrect number of arguments');
			if (len == 2) return -evalScheem(expr[1], env);
            return evalScheem(expr[1], env) - evalScheem(expr[2], env);

        case '*':
			if (len < 2) throw('Incorrect number of arguments');
			tmp = 1;
			for (var i = 1; i < len; ++i) {
				tmp *= evalScheem(expr[i], env);
			}
            return tmp;

        case '/':
			if (len != 3) throw('Incorrect number of arguments');
			tmp = evalScheem(expr[2], env);
			if (tmp == 0) throw('Division by zero');
            return evalScheem(expr[1], env) / tmp;

        case '%':
			if (len != 3) throw('Incorrect number of arguments');
			tmp = evalScheem(expr[2], env);
			if (tmp == 0) throw('Division by zero');
            return evalScheem(expr[1], env) % tmp;
				   
        case 'define':
			if (len != 3) throw('Incorrect number of arguments');
			tmp = expr[1];
			if (typeof env[tmp] !== 'undefined') throw('Symbol already defined');
            env[tmp] = evalScheem(expr[2], env);
            return 0;

        case 'set!':
			if (len != 3) throw('Incorrect number of arguments');
			tmp = expr[1];
			if (typeof env[tmp] === 'undefined') throw('Symbol not defined');
            return env[tmp] = evalScheem(expr[2], env);

        case 'begin':
			tmp = null;
            for (var i = 1; i < len; ++i) {
                tmp = evalScheem(expr[i], env);
            }
            return tmp;

		case 'quote':
			if (len != 2) throw('Incorrect number of arguments');
			return expr[1];
			
        case 'cons':
			if (len != 3) throw('Incorrect number of arguments');
            tmp = evalScheem(expr[2]);
			if (!isArray(tmp)) throw('Second argument must be an array');
			tmp = tmp.slice();
            tmp.unshift(evalScheem(expr[1]));
            return tmp;

        case 'car':
			if (len != 2) throw('Incorrect number of arguments');
			tmp = evalScheem(expr[1]);
			if (!isArray(tmp)) throw('First argument must be an array');
            return tmp[0] || null;

        case 'cdr':
			if (len != 2) throw('Incorrect number of arguments');
			tmp = evalScheem(expr[1]);
			if (!isArray(tmp)) throw('First argument must be an array');
            return tmp.slice(1) || [];

        case '=':
			if (len != 3) throw('Incorrect number of arguments');
            return (evalScheem(expr[1], env) ===
                 evalScheem(expr[2], env)) ? '#t' : '#f';

        case '<>':
			if (len != 3) throw('Incorrect number of arguments');
            return (evalScheem(expr[1], env) !==
                 evalScheem(expr[2], env)) ? '#t' : '#f';

        case '<':
			if (len != 3) throw('Incorrect number of arguments');
            return (evalScheem(expr[1], env) <
                 evalScheem(expr[2], env)) ? '#t' : '#f';

        case '>':
			if (len != 3) throw('Incorrect number of arguments');
            return (evalScheem(expr[1], env) >
                 evalScheem(expr[2], env)) ? '#t' : '#f';

        case '<=':
			if (len != 3) throw('Incorrect number of arguments');
            return (evalScheem(expr[1], env) <=
                 evalScheem(expr[2], env)) ? '#t' : '#f';

        case '>=':
			if (len != 3) throw('Incorrect number of arguments');
            return (evalScheem(expr[1], env) >=
                 evalScheem(expr[2], env)) ? '#t' : '#f';

        case 'if':
			if (len > 4 || len < 2) throw('Incorrect number of arguments');
            tmp = evalScheem(expr[1], env);
            if (tmp === '#t') return len > 2 ? evalScheem(expr[2], env) : '#t';
            return len == 4 ? evalScheem(expr[3], env) : '#f';
    }
};

// If we are used as Node module, export evalScheem
if (typeof module !== 'undefined') {
    module.exports.evalScheem = evalScheem;
    module.exports.evalScheemString = evalScheemString;
}