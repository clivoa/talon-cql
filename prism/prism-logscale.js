/**
 * Prism.js language definition for CrowdStrike LogScale / CQL
 *
 * Contributes syntax highlighting for CQL (CrowdStrike Query Language)
 * used in Falcon Long Term Storage / LogScale.
 *
 * Usage:
 *   ```cql
 *   #event_simpleName=ProcessRollup2
 *   | groupBy([ImageFileName], function=count())
 *   ```
 *
 * References:
 *   https://library.humio.com/data-analysis/syntax.html
 *   https://library.humio.com/data-analysis/functions.html
 */

Prism.languages.cql = {

	'comment': [
		{
			pattern: /\/\*[\s\S]*?\*\//,
			greedy: true
		},
		{
			pattern: /\/\/.*/,
			greedy: true
		}
	],

	'string': [
		{
			pattern: /"(?:\\[\s\S]|[^\\"])*"/,
			greedy: true
		},
		{
			pattern: /'(?:\\[\s\S]|[^\\'])*'/,
			greedy: true
		}
	],

	'regex': {
		pattern: /\/(?:\\[\s\S]|[^\\/])+\/[imsx]*/,
		greedy: true,
		alias: 'string'
	},

	// CrowdStrike event fields: #event_simpleName, #aid, #cid
	'event-field': {
		pattern: /#[a-zA-Z_][a-zA-Z0-9_./-]*/,
		alias: 'variable'
	},

	// Namespaced functions: array:*, math:*, text:*, time:*, crypto:*, explain:*, etc.
	'namespace-function': {
		pattern: /\b(?:array|math|text|time|crypto|geography|json|xml|ioc|bitfield|objectArray|unit|beta|explain):[a-zA-Z][a-zA-Z0-9]*(?=\s*\()/,
		alias: 'function'
	},

	// Built-in functions
	'function': {
		pattern: /\b(?:accumulate|asn|avg|base64Decode|base64Encode|bucket|callFunction|cidr|coalesce|collect|communityId|concat|concatArray|copyEvent|correlate|count|counterAsRate|createEvents|default|defineTable|drop|dropEvent|duration|end|eval|eventFieldCount|eventInternals|eventSize|fieldset|fieldstats|filter|findTimestamp|format|formatDuration|formatTime|geohash|getField|groupBy|hash|hashMatch|hashRewrite|head|if|in|ipLocation|join|kvParse|length|linReg|lookup|lower|lowercase|match|matchAsArray|max|min|neighbor|now|parseCEF|parseCsv|parseFixedWidth|parseHexString|parseJson|parseLEEF|parseInt|parseTimestamp|parseUri|parseUrl|parseXml|partition|percentage|percentile|range|rdns|readFile|regex|rename|replace|reverseDns|round|sample|sankey|select|selectFromMax|selectFromMin|selectLast|selfJoin|selfJoinFilter|series|session|setField|setTimeInterval|shannonEntropy|slidingTimeWindow|slidingWindow|sort|split|splitString|start|stats|stdDev|stripAnsiCodes|subnet|sum|table|tail|test|timeChart|tokenHash|top|transpose|uniq|union|upper|uppercase|urlDecode|urlEncode|wildcard|window|worldMap|writeJson)(?=\s*\()/,
		greedy: false
	},

	// Conditional keywords
	'keyword': {
		pattern: /\b(?:case|when|then|else|end|and|AND|or|OR|not|NOT|in|as|by|on|with|asc|desc|limit|span|function)\b/
	},

	// Boolean / null literals
	'boolean': /\b(?:true|false|null)\b/,

	// Numeric literals
	'number': /\b\d+(?:\.\d+)?\b/,

	// Pipe operator — the primary chaining mechanism
	'pipe': {
		pattern: /\|/,
		alias: 'operator'
	},

	// Assignment and comparison operators
	'operator': /(?::=|=~|!=|<=|>=|<|>|=)/,

	// Punctuation
	'punctuation': /[[\]{}(),]/
};

// Alias so ```logscale fences also work
Prism.languages.logscale = Prism.languages.cql;
