var parseScheem, evalScheem, evalScheemString, assert, expect;

if (typeof module !== 'undefined') {
    // In Node load required modules
	var chai = require('chai');
	
    assert = chai.assert;
    expect = chai.expect;

    var PEG = require('pegjs');
    var fs = require('fs');
	var scheem = require('../scheem');

    evalScheem = scheem.evalScheem;
    evalScheemString = scheem.eval;
	parseScheem = PEG.buildParser(fs.readFileSync('scheem.peg', 'utf-8')).parse;
} else {
    // In browser assume already loaded by <script> tags
    assert = chai.assert;
    expect = chai.expect;

    evalScheem = scheem.evalScheem;
    evalScheemString = scheem.eval;
    parseScheem = scheemParser.parse;
}

suite('quote', function () {
    test('a number', function () {
        assert.deepEqual(
            evalScheem(['quote', 3]),
            3
        );
    });
    test('an atom', function () {
        assert.deepEqual(
            evalScheem(['quote', 'dog']),
            'dog'
        );
    });
    test('a list', function () {
        assert.deepEqual(
            evalScheem(['quote', [1, 2, 3]]),
            [1, 2, 3]
        );
    });
    test('too many parameters', function () {
        expect(function () {
            evalScheem(['quote', [1], 2]);
        }).to.throw();
    });
});

suite('cons', function () {
    test('a number', function () {
        assert.deepEqual(
            evalScheem(['cons', 1, ['quote', [2, 3]]]),
            [1, 2, 3]
        );
    });
    test('a list', function () {
        assert.deepEqual(
            evalScheem(['cons', ['quote', [1, 2]], ['quote', [2, 3]]]),
            [[1, 2], 2, 3]
        );
    });
});

suite('car', function () {
    test('a list', function () {
        assert.deepEqual(
            evalScheem(['car', ['quote', [[2, 3], 3, 4]]]),
            [2, 3]
        );
    });
    test('a number', function () {
        assert.deepEqual(
            evalScheem(['car', ['quote', [1, 2]]]),
            1
        );
    });
    test('empty list', function () {
        expect(function () {
            evalScheem(['car', ['quote', []]]);
        }).to.throw();
    });
    test('too many parameters', function () {
        expect(function () {
            evalScheem(['car', ['quote', [1, 2]], 3]);
        }).to.throw();
    });
    test('non list', function () {
        expect(function () {
            evalScheem(['car', 1]);
        }).to.throw();
    });
});

suite('cdr', function () {
    test('a list', function () {
        assert.deepEqual(
            evalScheem(['cdr', ['quote', [1, 3, 4]]]),
            [3, 4]
        );
    });
    test('a single element list', function () {
        assert.deepEqual(
            evalScheem(['cdr', ['quote', [1]]]),
            []
        );
    });
    test('an empty list', function () {
        expect(function () {
            evalScheem(['cdr', ['quote', []]]);
        }).to.throw();
    });
    test('too many parameters', function () {
        expect(function () {
            evalScheem(['cdr', ['quote', [1, 2]], 3]);
        }).to.throw();
    });
    test('non list', function () {
        expect(function () {
            evalScheem(['cdr', 3]);
        }).to.throw();
    });
});

suite('define', function () {
    test('define', function () {
        var env = { b: 1 };
		
        evalScheem(['define', 'a', 3], env);
        assert.deepEqual(
            env,
            { a: 3, b: 1 }
        );
    });
    test('define already defined', function () {
        expect(function () {
            evalScheem(['define', 'a', 3], { a: 5 });
        }).to.throw();
    });
    test('define too many parameters', function () {
        expect(function () {
            evalScheem(['define', 'a', 3, 4]);
        }).to.throw();
    });
    test('define a number', function () {
        expect(function () {
            evalScheem(['define', '5', 3]);
        }).to.throw();
    });
});

suite('set!', function () {
    test('set!', function () {
        var env = { a: 4, b: 1 };
		
        evalScheem(['set!', 'a', 3], env);
        assert.deepEqual(
			env,
            { a: 3, b: 1 }
        );
    });
    test('set! too many parameters', function () {
        expect(function () {
            evalScheem(['set!', 'a', 3, 4]);
        }).to.throw();
    });
    test('set! not yet defined', function () {
        expect(function () {
            evalScheem(['set!', 'a', 3]);
        }).to.throw();
    });
    test('set! expression', function () {
        var env = { a: 4, b: 1 };
		
        evalScheem(['set!', 'a', ['+', 1, 2]], env);
        assert.deepEqual(
			env,
            { a: 3, b: 1 }
        );
    });
});

suite('begin', function () {
    test('a number', function () {
        assert.deepEqual(
            evalScheem(['begin', 1, 2, 3]),
            3
        );
    });
    test('an expression', function () {
        assert.deepEqual(
            evalScheem(['begin', 1, 2, ['+', 3, 4]]),
            7
        );
    });
    test('change environment', function () {
        var env = { a: 4 };
		
        evalScheem(['begin', ['set!', 'a', 3]], env);
        assert.deepEqual(
            env,
            { a: 3 }
        );
    });
    test('track environment', function () {
        var env = { a: 4 };
		
        assert.deepEqual(
			evalScheem(['begin', ['set!', 'a', 3], ['+', 'a', 2]], env),
            5
        );
    });
});

suite('if', function () {
    test('cond true, two branches', function () {
        assert.deepEqual(
            evalScheem(['if', ['=', 1, 1], 2, 3]),
            2
        );
    });
    test('cond false, two branches', function () {
        assert.deepEqual(
            evalScheem(['if', ['<>', 1, 1], 2, 3]),
            3
        );
    });
    test('cond true, one branch', function () {
        assert.deepEqual(
            evalScheem(['if', ['=', 1, 1], 2]),
            2
        );
    });
    test('cond false, one branch', function () {
        assert.deepEqual(
            evalScheem(['if', ['<>', 1, 1], 2]),
            '#f'
        );
    });
    test('cond true, no branches', function () {
        assert.deepEqual(
            evalScheem(['if', ['=', 1, 1]]),
            '#t'
        );
    });
    test('cond false, no branches', function () {
        assert.deepEqual(
            evalScheem(['if', ['<>', 1, 1]]),
            '#f'
        );
    });
});

suite('math', function () {
    test('add', function () {
        assert.deepEqual(
            evalScheem(['+', 1, 2]),
            3
        );
    });
    test('add single', function () {
        assert.deepEqual(
            evalScheem(['+', 1]),
            1
        );
    });
    test('add multiple', function () {
        assert.deepEqual(
            evalScheem(['+', 1, 2, 3]),
            6
        );
    });
    test('add multiple', function () {
        assert.deepEqual(
            evalScheem(['+', 1, 2, 3]),
            6
        );
    });
    test('subtract', function () {
        assert.deepEqual(
            evalScheem(['-', 1, 2]),
            -1 
        );
    });
    test('unary minus', function () {
        assert.deepEqual(
            evalScheem(['-', 1]),
            -1
        );
    });
    test('multiply', function () {
        assert.deepEqual(
            evalScheem(['*', 3, 2]),
            6 
        );
    });
    test('multiply single', function () {
        assert.deepEqual(
            evalScheem(['*', 3]),
            3
        );
    });
    test('multiply multiple', function () {
        assert.deepEqual(
            evalScheem(['*', 2, 3, 4]),
            24
        );
    });
    test('divide', function () {
        assert.deepEqual(
            evalScheem(['/', 12, 3]),
            4 
        );
    });
    test('modulus', function () {
        assert.deepEqual(
            evalScheem(['%', 7, 3]),
            1
        );
    });
});

suite('comparison', function () {
    test('equal', function () {
        assert.deepEqual(
            evalScheem(['=', 2, 2]),
            '#t'
        );
    });
    test('not equal', function () {
        assert.deepEqual(
            evalScheem(['=', 1, 2]),
            '#f'
        );
    });
    test('not-equal', function () {
        assert.deepEqual(
            evalScheem(['<>', 2, 2]),
            '#f'
        );
    });
    test('not not-equal', function () {
        assert.deepEqual(
            evalScheem(['<>', 1, 2]),
            '#t'
        );
    });
    test('less than', function () {
        assert.deepEqual(
            evalScheem(['<', 2, 3]),
            '#t' 
        );
    });
    test('not less than', function () {
        assert.deepEqual(
            evalScheem(['<', 12, 3]),
            '#f' 
        );
    });
    test('less than or equal to, less', function () {
        assert.deepEqual(
            evalScheem(['<=', 4, 12]),
            '#t' 
        );
    });
    test('less than or equal to, equal', function () {
        assert.deepEqual(
            evalScheem(['<=', 12, 12]),
            '#t' 
        );
    });
    test('not less than or equal to', function () {
        assert.deepEqual(
            evalScheem(['<=', 3, 2]),
            '#f' 
        );
    });
    test('greater than', function () {
        assert.deepEqual(
            evalScheem(['>', 12, 3]),
            '#t' 
        );
    });
    test('not greater than', function () {
        assert.deepEqual(
            evalScheem(['>', 2, 3]),
            '#f' 
        );
    });
    test('greater than or equal to, greater', function () {
        assert.deepEqual(
            evalScheem(['>=', 12, 4]),
            '#t' 
        );
    });
    test('greater than or equal to, equal', function () {
        assert.deepEqual(
            evalScheem(['>=', 12, 12]),
            '#t' 
        );
    });
    test('not greater than or equal to', function () {
        assert.deepEqual(
            evalScheem(['>=', 2, 3]),
            '#f' 
        );
    });
});

suite('parse', function () {
    test('alphanumeric atoms', function () {
        assert.deepEqual(
            parseScheem('a'),
            'a'
        );
    });
    test('special char atom', function () {
        assert.deepEqual(
            parseScheem('!'),
            '!'
        );
    });
    test('numeric atom', function () {
        assert.deepEqual(
            parseScheem('9876543210'),
            9876543210
        );
    });
    test('flat list, empty', function () {
        assert.deepEqual(
            parseScheem('()'),
            []
        );
    });
    test('flat list, one element', function () {
        assert.deepEqual(
            parseScheem('(a)'),
            ['a']
        );
    });
    test('flat list, many elements', function () {
        assert.deepEqual(
            parseScheem('(a b c)'),
            ['a', 'b', 'c']
        );
    });
    test('nested list, single element', function () {
        assert.deepEqual(
            parseScheem('((a))'),
            [['a']]
        );
    });
    test('nested list, complex', function () {
        assert.deepEqual(
            parseScheem('(a b (c d e (f g)))'),
            ['a', 'b', ['c', 'd', 'e', ['f', 'g']]]
        );
    });
    test('quote', function () {
        assert.deepEqual(
            parseScheem('\'(b d)'),
            ['quote', ['b', 'd']]
        );
    });
    test('whitespace', function () {
        assert.deepEqual(
            parseScheem('  (\n\ra\n\tb\n\t c\r)\t'),
            ['a', 'b', 'c']
        );
    });
    test('comments', function () {
        assert.deepEqual(
            parseScheem('(a b;;comment with closing parenthesis)\n)'),
            ['a', 'b']
        );
    });
});

suite('evaluation', function () {
    test('add', function () {
        assert.deepEqual(
            evalScheemString('(+ 1 2)'),
            3
        );
    });
    test('begin', function () {
        assert.deepEqual(
            evalScheemString('(begin (define x 5) (+ x 2))'),
            7
        );
    });
    test('if', function () {
        assert.deepEqual(
            evalScheemString('(if (= 3 3) \'(x y) \'(z w))'),
            ['x', 'y']
        );
    });
});