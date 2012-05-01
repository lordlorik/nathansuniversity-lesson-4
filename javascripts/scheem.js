scheem = (function () {
	var parseScheem;
	
	if (typeof module !== 'undefined') {
		var PEG = require('pegjs');
		var fs = require('fs');

		try {
			parseScheem = PEG.buildParser(fs.readFileSync('scheem.peg', 'utf-8')).parse;
		}
		catch (e) {
			parseScheem = PEG.buildParser(fs.readFileSync('../scheem.peg', 'utf-8')).parse;
		}
	}
	else {
		parseScheem = scheemParser.parse;
	};

	var eval = function (string, env) {
		return evalScheem(parseScheem(string), env || {});
	};

	var isArray = function (obj) {
		return obj && obj instanceof Array;
	};

	var checkNumber = function (obj) {
		if (typeof obj !== 'number') throw('Invalid number');
		return true;
	};

	var evalScheem = function (expr, env) {
		// Special error token
		if (expr === 'error') throw('Error');
		
		// Nil
		if (expr === 'nil') return null;

		// Numbers evaluate to themselves
		if (typeof expr === 'number') {
			return expr;
		}

		// Strings are variable references
		if (typeof expr === 'string') {
			return env[expr];
		}

		var len = expr.length,
			tmp, tmp2;
		
		// Look at head of list for operation
		switch (expr[0]) {
			case '+':
				if (len == 1) throw('Incorrect number of arguments');
				tmp = 0;
				for (var i = 1; i < len; ++i) {
					tmp2 = evalScheem(expr[i], env);
					tmp += checkNumber(tmp2) && tmp2;
				}
				return tmp;

			case '-':
				if (len > 3 || len < 2) throw('Incorrect number of arguments');
				if (len == 2) return -evalScheem(expr[1], env);
				tmp = evalScheem(expr[1], env);
				tmp2 = evalScheem(expr[2], env);
				return checkNumber(expr[1]) && checkNumber(expr[2]) && tmp - tmp2;

			case '*':
				if (len < 2) throw('Incorrect number of arguments');
				tmp = 1;
				for (var i = 1; i < len; ++i) {
					tmp2 = evalScheem(expr[i], env);
					tmp *= checkNumber(tmp2) && tmp2;
				}
				return tmp;

			case '/':
				if (len != 3) throw('Incorrect number of arguments');
				tmp = evalScheem(expr[1], env);
				tmp2 = evalScheem(expr[2], env);
				if (tmp2 == 0) throw('Division by zero');
				return checkNumber(expr[1]) && checkNumber(expr[2]) && tmp / tmp2;

			case '%':
				if (len != 3) throw('Incorrect number of arguments');
				tmp = evalScheem(expr[1], env);
				tmp2 = evalScheem(expr[2], env);
				if (tmp2 == 0) throw('Division by zero');
				return checkNumber(expr[1]) && checkNumber(expr[2]) && tmp % tmp2;
					   
			case 'define':
				if (len != 3) throw('Incorrect number of arguments');
				tmp = expr[1];
				if (typeof tmp !== 'string' || +tmp === tmp) throw('Invalid symbol');
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
				if (!isArray(tmp)) throw('Second argument must be a list');
				tmp = tmp.slice();
				tmp.unshift(evalScheem(expr[1]));
				return tmp;

			case 'car':
				if (len != 2) throw('Incorrect number of arguments');
				tmp = evalScheem(expr[1]);
				if (!isArray(tmp) || !tmp.length) throw('First argument must be an non-empty list');
				return tmp[0];

			case 'cdr':
				if (len != 2) throw('Incorrect number of arguments');
				tmp = evalScheem(expr[1]);
				if (!isArray(tmp) || !tmp.length) throw('First argument must be a non-empty list');
				return tmp.slice(1);

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
	
	return {
		eval: eval,
		evalScheem: evalScheem
	}
})();

// If we are used as Node module, export evalScheem
if (typeof module !== 'undefined') {
	module.exports.eval = scheem.eval;
	module.exports.evalScheem = scheem.evalScheem;
}