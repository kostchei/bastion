import { type SpreadsheetState, getCell, parseKey, letterToCol, colToLetter, cellKey } from '../models/Spreadsheet';

/* ============ Token Types ============ */

type TokenType =
    | 'NUMBER'
    | 'STRING'
    | 'CELL_REF'
    | 'RANGE'
    | 'OPERATOR'
    | 'LPAREN'
    | 'RPAREN'
    | 'COMMA'
    | 'FUNCTION';

interface Token {
    type: TokenType;
    value: string;
}

/* ============ AST Node Types ============ */

type ASTNode =
    | { type: 'number'; value: number }
    | { type: 'string'; value: string }
    | { type: 'cell_ref'; key: string }
    | { type: 'range'; start: string; end: string }
    | { type: 'binary'; op: string; left: ASTNode; right: ASTNode }
    | { type: 'unary'; op: string; operand: ASTNode }
    | { type: 'function'; name: string; args: ASTNode[] }
    | { type: 'comparison'; op: string; left: ASTNode; right: ASTNode };

/* ============ Tokenizer ============ */

function tokenize(formula: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < formula.length) {
        const ch = formula[i];

        // Skip whitespace
        if (ch === ' ' || ch === '\t') {
            i++;
            continue;
        }

        // Numbers
        if (ch >= '0' && ch <= '9') {
            let num = '';
            while (i < formula.length && ((formula[i] >= '0' && formula[i] <= '9') || formula[i] === '.')) {
                num += formula[i++];
            }
            tokens.push({ type: 'NUMBER', value: num });
            continue;
        }

        // String literal
        if (ch === '"') {
            let str = '';
            i++; // skip opening quote
            while (i < formula.length && formula[i] !== '"') {
                str += formula[i++];
            }
            i++; // skip closing quote
            tokens.push({ type: 'STRING', value: str });
            continue;
        }

        // Cell references, ranges, and function names
        if (ch >= 'A' && ch <= 'Z') {
            let word = '';
            while (i < formula.length && formula[i] >= 'A' && formula[i] <= 'Z') {
                word += formula[i++];
            }

            // Check if followed by a digit → cell reference
            if (i < formula.length && formula[i] >= '0' && formula[i] <= '9') {
                let rowPart = '';
                while (i < formula.length && formula[i] >= '0' && formula[i] <= '9') {
                    rowPart += formula[i++];
                }
                const ref = word + rowPart;

                // Check for range (A1:B2)
                if (i < formula.length && formula[i] === ':') {
                    i++; // skip colon
                    let endRef = '';
                    while (i < formula.length && ((formula[i] >= 'A' && formula[i] <= 'Z') || (formula[i] >= '0' && formula[i] <= '9'))) {
                        endRef += formula[i++];
                    }
                    tokens.push({ type: 'RANGE', value: `${ref}:${endRef}` });
                } else {
                    tokens.push({ type: 'CELL_REF', value: ref });
                }
            } else if (i < formula.length && formula[i] === '(') {
                // Function name
                tokens.push({ type: 'FUNCTION', value: word });
            } else {
                // Treat as cell ref without row? Probably an error, but parse as text
                tokens.push({ type: 'STRING', value: word });
            }
            continue;
        }

        // Operators
        if ('+-*/^'.includes(ch)) {
            tokens.push({ type: 'OPERATOR', value: ch });
            i++;
            continue;
        }

        // Comparison operators
        if (ch === '>' || ch === '<' || ch === '=') {
            let op = ch;
            i++;
            if (i < formula.length && (formula[i] === '=' || (ch === '<' && formula[i] === '>'))) {
                op += formula[i++];
            }
            tokens.push({ type: 'OPERATOR', value: op });
            continue;
        }

        if (ch === '!') {
            i++;
            if (i < formula.length && formula[i] === '=') {
                tokens.push({ type: 'OPERATOR', value: '!=' });
                i++;
            }
            continue;
        }

        if (ch === '(') {
            tokens.push({ type: 'LPAREN', value: '(' });
            i++;
            continue;
        }

        if (ch === ')') {
            tokens.push({ type: 'RPAREN', value: ')' });
            i++;
            continue;
        }

        if (ch === ',') {
            tokens.push({ type: 'COMMA', value: ',' });
            i++;
            continue;
        }

        // Skip unknown characters
        i++;
    }

    return tokens;
}

/* ============ Parser ============ */

class Parser {
    private tokens: Token[];
    private pos: number;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.pos = 0;
    }

    private peek(): Token | null {
        return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
    }

    private consume(): Token {
        return this.tokens[this.pos++];
    }

    parse(): ASTNode {
        const node = this.parseComparison();
        return node;
    }

    private parseComparison(): ASTNode {
        let left = this.parseExpression();
        const t = this.peek();
        if (t && t.type === 'OPERATOR' && ['=', '<>', '!=', '<', '>', '<=', '>='].includes(t.value)) {
            this.consume();
            const right = this.parseExpression();
            return { type: 'comparison', op: t.value, left, right };
        }
        return left;
    }

    private parseExpression(): ASTNode {
        let left = this.parseTerm();
        while (true) {
            const t = this.peek();
            if (t && t.type === 'OPERATOR' && (t.value === '+' || t.value === '-')) {
                this.consume();
                const right = this.parseTerm();
                left = { type: 'binary', op: t.value, left, right };
            } else {
                break;
            }
        }
        return left;
    }

    private parseTerm(): ASTNode {
        let left = this.parsePower();
        while (true) {
            const t = this.peek();
            if (t && t.type === 'OPERATOR' && (t.value === '*' || t.value === '/')) {
                this.consume();
                const right = this.parsePower();
                left = { type: 'binary', op: t.value, left, right };
            } else {
                break;
            }
        }
        return left;
    }

    private parsePower(): ASTNode {
        let left = this.parseUnary();
        const t = this.peek();
        if (t && t.type === 'OPERATOR' && t.value === '^') {
            this.consume();
            const right = this.parsePower(); // Right-associative
            left = { type: 'binary', op: '^', left, right };
        }
        return left;
    }

    private parseUnary(): ASTNode {
        const t = this.peek();
        if (t && t.type === 'OPERATOR' && (t.value === '+' || t.value === '-')) {
            this.consume();
            const operand = this.parsePrimary();
            return { type: 'unary', op: t.value, operand };
        }
        return this.parsePrimary();
    }

    private parsePrimary(): ASTNode {
        const t = this.peek();
        if (!t) throw new Error('#VALUE!');

        if (t.type === 'NUMBER') {
            this.consume();
            return { type: 'number', value: parseFloat(t.value) };
        }

        if (t.type === 'STRING') {
            this.consume();
            return { type: 'string', value: t.value };
        }

        if (t.type === 'CELL_REF') {
            this.consume();
            return { type: 'cell_ref', key: t.value };
        }

        if (t.type === 'RANGE') {
            this.consume();
            const parts = t.value.split(':');
            return { type: 'range', start: parts[0], end: parts[1] };
        }

        if (t.type === 'FUNCTION') {
            this.consume();
            const name = t.value;
            this.expect('LPAREN');
            const args: ASTNode[] = [];
            while (this.peek() && this.peek()!.type !== 'RPAREN') {
                args.push(this.parse());
                if (this.peek() && this.peek()!.type === 'COMMA') {
                    this.consume();
                }
            }
            this.expect('RPAREN');
            return { type: 'function', name, args };
        }

        if (t.type === 'LPAREN') {
            this.consume();
            const node = this.parse();
            this.expect('RPAREN');
            return node;
        }

        throw new Error('#VALUE!');
    }

    private expect(type: TokenType): void {
        const t = this.consume();
        if (!t || t.type !== type) {
            throw new Error('#VALUE!');
        }
    }
}

/* ============ Range Expansion ============ */

function expandRange(start: string, end: string): string[] {
    const s = parseKey(start);
    const e = parseKey(end);
    if (!s || !e) return [];

    const keys: string[] = [];
    const minRow = Math.min(s.row, e.row);
    const maxRow = Math.max(s.row, e.row);
    const minCol = Math.min(s.col, e.col);
    const maxCol = Math.max(s.col, e.col);

    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            keys.push(cellKey(r, c));
        }
    }
    return keys;
}

/* ============ Evaluator ============ */

function evaluate(node: ASTNode, state: SpreadsheetState, visited: Set<string>): number | string {
    switch (node.type) {
        case 'number':
            return node.value;

        case 'string':
            return node.value;

        case 'cell_ref': {
            if (visited.has(node.key)) throw new Error('#CIRCULAR!');
            const cell = getCell(state, node.key);
            if (cell.error) throw new Error(cell.error);
            if (cell.type === 'empty') return 0;
            const val = cell.computed || cell.raw;
            const num = parseFloat(val);
            return isNaN(num) ? val : num;
        }

        case 'range':
            throw new Error('#VALUE!'); // Ranges only valid as function args

        case 'unary': {
            const val = evaluate(node.operand, state, visited);
            if (typeof val === 'string') throw new Error('#VALUE!');
            return node.op === '-' ? -val : val;
        }

        case 'binary': {
            const left = evaluate(node.left, state, visited);
            const right = evaluate(node.right, state, visited);

            // String concatenation with &
            if (node.op === '+' && (typeof left === 'string' || typeof right === 'string')) {
                return String(left) + String(right);
            }

            if (typeof left !== 'number' || typeof right !== 'number') throw new Error('#VALUE!');

            switch (node.op) {
                case '+': return left + right;
                case '-': return left - right;
                case '*': return left * right;
                case '/':
                    if (right === 0) throw new Error('#DIV/0!');
                    return left / right;
                case '^': return Math.pow(left, right);
                default: throw new Error('#VALUE!');
            }
        }

        case 'comparison': {
            const left = evaluate(node.left, state, visited);
            const right = evaluate(node.right, state, visited);
            const l = typeof left === 'number' ? left : parseFloat(left) || 0;
            const r = typeof right === 'number' ? right : parseFloat(right) || 0;
            let result = false;
            switch (node.op) {
                case '=': result = l === r; break;
                case '<>': case '!=': result = l !== r; break;
                case '<': result = l < r; break;
                case '>': result = l > r; break;
                case '<=': result = l <= r; break;
                case '>=': result = l >= r; break;
            }
            return result ? 1 : 0;
        }

        case 'function': {
            const name = node.name.toUpperCase();
            return evaluateFunction(name, node.args, state, visited);
        }
    }
}

/* ============ Built-in Functions ============ */

function collectNumbers(args: ASTNode[], state: SpreadsheetState, visited: Set<string>): number[] {
    const numbers: number[] = [];
    for (const arg of args) {
        if (arg.type === 'range') {
            const keys = expandRange(arg.start, arg.end);
            for (const key of keys) {
                const cell = getCell(state, key);
                if (cell.type !== 'empty') {
                    const val = parseFloat(cell.computed || cell.raw);
                    if (!isNaN(val)) numbers.push(val);
                }
            }
        } else {
            const val = evaluate(arg, state, visited);
            if (typeof val === 'number') numbers.push(val);
            else {
                const num = parseFloat(val);
                if (!isNaN(num)) numbers.push(num);
            }
        }
    }
    return numbers;
}

function evaluateFunction(
    name: string,
    args: ASTNode[],
    state: SpreadsheetState,
    visited: Set<string>,
): number | string {
    switch (name) {
        case 'SUM': {
            const nums = collectNumbers(args, state, visited);
            return nums.reduce((a, b) => a + b, 0);
        }
        case 'AVERAGE': {
            const nums = collectNumbers(args, state, visited);
            if (nums.length === 0) throw new Error('#DIV/0!');
            return nums.reduce((a, b) => a + b, 0) / nums.length;
        }
        case 'MIN': {
            const nums = collectNumbers(args, state, visited);
            if (nums.length === 0) return 0;
            return Math.min(...nums);
        }
        case 'MAX': {
            const nums = collectNumbers(args, state, visited);
            if (nums.length === 0) return 0;
            return Math.max(...nums);
        }
        case 'COUNT': {
            const nums = collectNumbers(args, state, visited);
            return nums.length;
        }
        case 'ABS': {
            if (args.length < 1) throw new Error('#VALUE!');
            const val = evaluate(args[0], state, visited);
            if (typeof val !== 'number') throw new Error('#VALUE!');
            return Math.abs(val);
        }
        case 'ROUND': {
            if (args.length < 1) throw new Error('#VALUE!');
            const val = evaluate(args[0], state, visited);
            if (typeof val !== 'number') throw new Error('#VALUE!');
            const places = args.length > 1 ? evaluate(args[1], state, visited) : 0;
            if (typeof places !== 'number') throw new Error('#VALUE!');
            const factor = Math.pow(10, places);
            return Math.round(val * factor) / factor;
        }
        case 'FLOOR': {
            if (args.length < 1) throw new Error('#VALUE!');
            const val = evaluate(args[0], state, visited);
            if (typeof val !== 'number') throw new Error('#VALUE!');
            return Math.floor(val);
        }
        case 'CEILING': {
            if (args.length < 1) throw new Error('#VALUE!');
            const val = evaluate(args[0], state, visited);
            if (typeof val !== 'number') throw new Error('#VALUE!');
            return Math.ceil(val);
        }
        case 'IF': {
            if (args.length < 2) throw new Error('#VALUE!');
            const condition = evaluate(args[0], state, visited);
            const isTruthy = typeof condition === 'number' ? condition !== 0 : condition !== '';
            if (isTruthy) {
                return evaluate(args[1], state, visited);
            }
            return args.length > 2 ? evaluate(args[2], state, visited) : 0;
        }
        case 'CONCATENATE':
        case 'CONCAT': {
            return args.map(a => String(evaluate(a, state, visited))).join('');
        }
        case 'LEN': {
            if (args.length < 1) throw new Error('#VALUE!');
            return String(evaluate(args[0], state, visited)).length;
        }
        case 'UPPER': {
            if (args.length < 1) throw new Error('#VALUE!');
            return String(evaluate(args[0], state, visited)).toUpperCase();
        }
        case 'LOWER': {
            if (args.length < 1) throw new Error('#VALUE!');
            return String(evaluate(args[0], state, visited)).toLowerCase();
        }
        default:
            throw new Error('#NAME?');
    }
}

/* ============ Dependency Graph ============ */

export class DependencyGraph {
    // key → set of keys that depend on key
    private dependents: Map<string, Set<string>> = new Map();
    // key → set of keys that key depends on
    private dependencies: Map<string, Set<string>> = new Map();

    /** Record that `cellKey` depends on `dependsOnKeys` */
    setDependencies(key: string, dependsOnKeys: string[]): void {
        // Remove old dependencies
        const oldDeps = this.dependencies.get(key);
        if (oldDeps) {
            for (const dep of oldDeps) {
                this.dependents.get(dep)?.delete(key);
            }
        }

        // Set new
        const newDeps = new Set(dependsOnKeys);
        this.dependencies.set(key, newDeps);
        for (const dep of newDeps) {
            if (!this.dependents.has(dep)) {
                this.dependents.set(dep, new Set());
            }
            this.dependents.get(dep)!.add(key);
        }
    }

    /** Get all cells that need recalculating when `key` changes (topological order) */
    getDependents(key: string): string[] {
        const result: string[] = [];
        const visited = new Set<string>();
        const queue = [key];

        while (queue.length > 0) {
            const current = queue.shift()!;
            const deps = this.dependents.get(current);
            if (deps) {
                for (const dep of deps) {
                    if (!visited.has(dep)) {
                        visited.add(dep);
                        result.push(dep);
                        queue.push(dep);
                    }
                }
            }
        }
        return result;
    }

    /** Extract cell references from formula text */
    static extractRefs(formulaText: string): string[] {
        const refs: string[] = [];
        const rangeRegex = /([A-Z]+\d+):([A-Z]+\d+)/g;
        const cellRegex = /([A-Z]+\d+)/g;

        // First extract ranges
        let match;
        const rangePositions = new Set<number>();
        while ((match = rangeRegex.exec(formulaText)) !== null) {
            const rangeKeys = expandRange(match[1], match[2]);
            refs.push(...rangeKeys);
            for (let p = match.index; p < match.index + match[0].length; p++) {
                rangePositions.add(p);
            }
        }

        // Then extract single cell refs that aren't part of ranges
        while ((match = cellRegex.exec(formulaText)) !== null) {
            if (!rangePositions.has(match.index)) {
                refs.push(match[1]);
            }
        }

        return [...new Set(refs)];
    }
}

/* ============ Public API ============ */

export function evaluateFormula(
    formulaText: string,
    state: SpreadsheetState,
    currentCellKey?: string,
): { result: string; error?: string; refs: string[] } {
    try {
        const text = formulaText.startsWith('=') ? formulaText.slice(1) : formulaText;
        const upper = text.toUpperCase();
        const tokens = tokenize(upper);
        const parser = new Parser(tokens);
        const ast = parser.parse();
        const visited = new Set<string>();
        if (currentCellKey) visited.add(currentCellKey);
        const result = evaluate(ast, state, visited);
        const refs = DependencyGraph.extractRefs(upper);

        // Format result
        let display: string;
        if (typeof result === 'number') {
            // Avoid floating point noise
            display = parseFloat(result.toFixed(10)).toString();
        } else {
            display = String(result);
        }

        return { result: display, refs };
    } catch (e) {
        const error = e instanceof Error ? e.message : '#ERROR!';
        return { result: error, error, refs: DependencyGraph.extractRefs(formulaText.toUpperCase()) };
    }
}

/* ============ Cell Value Processing ============ */

export function processCell(
    key: string,
    raw: string,
    state: SpreadsheetState,
    depGraph: DependencyGraph,
): void {
    const cell = getCell(state, key);
    cell.raw = raw;
    cell.error = undefined;

    if (raw === '') {
        cell.type = 'empty';
        cell.computed = '';
        depGraph.setDependencies(key, []);
    } else if (raw.startsWith('=')) {
        cell.type = 'formula';
        const { result, error, refs } = evaluateFormula(raw, state, key);
        cell.computed = result;
        cell.error = error;
        depGraph.setDependencies(key, refs);
    } else {
        const num = parseFloat(raw);
        if (!isNaN(num) && raw.trim() === num.toString()) {
            cell.type = 'number';
            cell.computed = raw;
        } else {
            cell.type = 'text';
            cell.computed = raw;
        }
        depGraph.setDependencies(key, []);
    }

    // Recalculate dependents
    const dependents = depGraph.getDependents(key);
    for (const depKey of dependents) {
        const depCell = getCell(state, depKey);
        if (depCell.type === 'formula') {
            const { result, error } = evaluateFormula(depCell.raw, state, depKey);
            depCell.computed = result;
            depCell.error = error;
        }
    }
}

// Re-export helpers from Spreadsheet
export { expandRange, colToLetter, letterToCol, cellKey, parseKey };
