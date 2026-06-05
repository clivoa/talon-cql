export const CQL_KEYWORDS = new Set([
	"case", "when", "then", "else", "end",
	"and", "AND", "or", "OR", "not", "NOT",
	"in", "as", "by", "on", "with",
	"asc", "desc", "limit", "span", "function",
]);

export const CQL_FUNCTIONS = new Set([
	"accumulate", "asn", "avg", "base64Decode", "base64Encode", "bucket",
	"callFunction", "cidr", "coalesce", "collect", "communityId", "concat",
	"concatArray", "copyEvent", "correlate", "count", "counterAsRate",
	"createEvents", "default", "defineTable", "drop", "dropEvent", "duration",
	"end", "eval", "eventFieldCount", "eventInternals", "eventSize", "fieldset",
	"fieldstats", "filter", "findTimestamp", "format", "formatDuration",
	"formatTime", "geohash", "getField", "groupBy", "hash", "hashMatch",
	"hashRewrite", "head", "if", "in", "ipLocation", "join", "kvParse",
	"length", "linReg", "lookup", "lower", "lowercase", "match", "matchAsArray",
	"max", "min", "neighbor", "now", "parseCEF", "parseCsv", "parseFixedWidth",
	"parseHexString", "parseJson", "parseLEEF", "parseInt", "parseTimestamp",
	"parseUri", "parseUrl", "parseXml", "partition", "percentage", "percentile",
	"range", "rdns", "readFile", "regex", "rename", "replace", "reverseDns",
	"round", "sample", "sankey", "select", "selectFromMax", "selectFromMin",
	"selectLast", "selfJoin", "selfJoinFilter", "series", "session", "setField",
	"setTimeInterval", "shannonEntropy", "slidingTimeWindow", "slidingWindow",
	"sort", "split", "splitString", "start", "stats", "stdDev", "stripAnsiCodes",
	"subnet", "sum", "table", "tail", "test", "timeChart", "tokenHash", "top",
	"transpose", "uniq", "union", "upper", "uppercase", "urlDecode", "urlEncode",
	"wildcard", "window", "worldMap", "writeJson",
]);

export const CQL_NAMESPACES = new Set([
	"array", "math", "text", "time", "crypto",
	"geography", "json", "xml", "ioc", "bitfield",
	"objectArray", "unit", "beta", "explain",
]);

type TokenType =
	| "comment" | "string" | "regex" | "event-field"
	| "pipe" | "operator" | "number" | "keyword"
	| "namespace-function" | "function" | "field" | null;

interface Token {
	type: TokenType;
	end: number;
}

export function nextToken(line: string, pos: number): Token {
	const ch = line[pos];

	// Block comment
	if (line.startsWith("/*", pos)) {
		const end = line.indexOf("*/", pos + 2);
		return { type: "comment", end: end >= 0 ? end + 2 : line.length };
	}

	// Line comment
	if (line.startsWith("//", pos)) {
		return { type: "comment", end: line.length };
	}

	// Double-quoted string
	if (ch === '"') {
		let i = pos + 1;
		while (i < line.length) {
			if (line[i] === "\\") { i += 2; continue; }
			if (line[i] === '"') { i++; break; }
			i++;
		}
		return { type: "string", end: i };
	}

	// Single-quoted string
	if (ch === "'") {
		let i = pos + 1;
		while (i < line.length) {
			if (line[i] === "\\") { i += 2; continue; }
			if (line[i] === "'") { i++; break; }
			i++;
		}
		return { type: "string", end: i };
	}

	// Regex literal — only when preceded by = or [ or ( or start of line (after spaces)
	if (ch === "/") {
		let i = pos + 1;
		while (i < line.length) {
			if (line[i] === "\\") { i += 2; continue; }
			if (line[i] === "/") {
				i++;
				while (i < line.length && /[imsx]/.test(line[i])) i++;
				break;
			}
			i++;
		}
		return { type: "regex", end: i };
	}

	// Event field: #fieldName
	if (ch === "#") {
		const m = line.slice(pos).match(/^#[a-zA-Z_][a-zA-Z0-9_./-]*/);
		return { type: "event-field", end: pos + (m ? m[0].length : 1) };
	}

	// Pipe
	if (ch === "|") {
		return { type: "pipe", end: pos + 1 };
	}

	// Multi-char operators first
	if (line.startsWith(":=", pos)) return { type: "operator", end: pos + 2 };
	if (line.startsWith("=~", pos)) return { type: "operator", end: pos + 2 };
	if (line.startsWith("!=", pos)) return { type: "operator", end: pos + 2 };
	if (line.startsWith("<=", pos)) return { type: "operator", end: pos + 2 };
	if (line.startsWith(">=", pos)) return { type: "operator", end: pos + 2 };
	if (ch === "=" || ch === "<" || ch === ">") return { type: "operator", end: pos + 1 };

	// Numbers
	const numM = line.slice(pos).match(/^\d+(\.\d+)?/);
	if (numM) return { type: "number", end: pos + numM[0].length };

	// Identifiers
	const wordM = line.slice(pos).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
	if (wordM) {
		const word = wordM[0];
		const after = pos + word.length;

		// Namespaced function: array:append
		if (line[after] === ":" && CQL_NAMESPACES.has(word)) {
			const rest = line.slice(after + 1).match(/^[a-zA-Z][a-zA-Z0-9]*/);
			if (rest) return { type: "namespace-function", end: after + 1 + rest[0].length };
		}

		if (CQL_KEYWORDS.has(word)) return { type: "keyword", end: after };
		if (CQL_FUNCTIONS.has(word)) return { type: "function", end: after };
		return { type: "field", end: after };
	}

	// Single unrecognized char
	return { type: null, end: pos + 1 };
}

const TOKEN_CLASS: Record<string, string> = {
	"comment":            "cql-comment",
	"string":             "cql-string",
	"regex":              "cql-regex",
	"event-field":        "cql-event-field",
	"pipe":               "cql-pipe",
	"operator":           "cql-operator",
	"number":             "cql-number",
	"keyword":            "cql-keyword",
	"namespace-function": "cql-namespace-function",
	"function":           "cql-function",
	"field":              "cql-field",
};

export function highlightCQL(source: string, label = "CQL"): HTMLElement {
	const wrapper = activeDocument.createElement("div");
	wrapper.className = "cql-wrapper";

	// Controls: label + copy button stacked in top-right corner
	const controls = activeDocument.createElement("div");
	controls.className = "cql-controls";

	const flair = activeDocument.createElement("div");
	flair.className = "cql-flair";
	flair.textContent = label;
	controls.appendChild(flair);

	const copyBtn = activeDocument.createElement("button");
	copyBtn.className = "cql-copy-btn";
	copyBtn.textContent = "Copy";
	copyBtn.addEventListener("click", () => {
		void navigator.clipboard.writeText(source).then(() => {
			copyBtn.textContent = "Copied!";
			copyBtn.classList.add("cql-copy-btn--success");
			activeWindow.setTimeout(() => {
				copyBtn.textContent = "Copy";
				copyBtn.classList.remove("cql-copy-btn--success");
			}, 2000);
		});
	});
	controls.appendChild(copyBtn);

	wrapper.appendChild(controls);

	const pre = activeDocument.createElement("pre");
	pre.className = "cql-block";
	wrapper.appendChild(pre);

	const code = activeDocument.createElement("code");
	pre.appendChild(code);

	const lines = source.split("\n");
	for (let i = 0; i < lines.length; i++) {
		appendLine(code, lines[i]);
		if (i < lines.length - 1) {
			code.appendChild(activeDocument.createTextNode("\n"));
		}
	}

	return wrapper;
}

function appendLine(parent: HTMLElement, line: string) {
	let pos = 0;
	while (pos < line.length) {
		// Consume whitespace as plain text
		if (/\s/.test(line[pos])) {
			const start = pos;
			while (pos < line.length && /\s/.test(line[pos])) pos++;
			parent.appendChild(activeDocument.createTextNode(line.slice(start, pos)));
			continue;
		}

		const tok = nextToken(line, pos);
		const text = line.slice(pos, tok.end);

		// Safety: if tokenizer stalled, advance one char
		if (tok.end <= pos) {
			parent.appendChild(activeDocument.createTextNode(line[pos]));
			pos++;
			continue;
		}

		if (tok.type && TOKEN_CLASS[tok.type]) {
			const span = activeDocument.createElement("span");
			span.className = TOKEN_CLASS[tok.type];
			span.textContent = text;
			parent.appendChild(span);
		} else {
			parent.appendChild(activeDocument.createTextNode(text));
		}

		pos = tok.end;
	}
}
