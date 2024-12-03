export const CharCode = {
	Tab: "\t",
	LineBreak: "\n",
	Space: " ",
	ExclamationMark: "!",
	Hash: "#",
	Dollar: "$",
	Percent: "%",
	Asterisk: "*",
	Dash: "-",
	Bullet: "•",
	Plus: "+",
	UnderScore: "_",
	BackTick: "`",
	Circumflex: "^",
	Tilde: "~",
	Dot: ".",
	Pipe: "|",
	Equal: "=",
	Slash: "/",
	BackSlash: "\\",
	Colon: ":",
	BlockQuote: ">",
	OpeningAngleBracket: "<",
	closeingAngleBracket: ">",
	OpeningParenthesis: "(",
	ClosingParenthesis: ")",
	OpeningSqrBracket: "[",
	ClosingSqrBracket: "]",
	openingCurlyBracket: "{",
	closingCurlyBracket: "}",
};

export const TwinMarkers = new Set(["*", "_", "~", "=", "`", "$", "[", "]", "(", ")"]);
export const BlockMarkers = new Set(["#", "-", "+", ">"]);
export const Markers = new Set([...TwinMarkers, ...BlockMarkers, "!", "\n", "<", "%", "\\"]);

export const TableDividers = new Set([CharCode.Pipe, CharCode.Space, CharCode.Dash]);

export const Sequences = {
	FrontMatter: "---",
	Fence: "```",
	Math: "$$",
	CommentEnd: "-->",
};

export const State = {
	BeforeNewLine: "BeforeNewLine",
	BeforeHeading: "BeforeHeading",
	BeforeUnorderedList: "BeforeUnorderedList",
	BeforeOrderedList: "BeforeOrderedList",
	BeforeFenceBlock: "BeforeFenceBlock",
	InFenceBlock: "InFenceBlock",
	BeforeMathBlock: "BeforeMathBlock",
	InMathBlock: "InMathBlock",
	BeforeEmbedLink: "BeforeEmbedLink",
	BeforeLinkUrl: "BeforeLinkUrl",
	InEmbedLink: "InEmbedLink",
	InLinkUrl: "InLinkUrl",
	InFootNote: "InFootNote",
};

export const Brackets = {
	"(": ")",
	"[": "]",
};

export const BlockMarkerTags = {
	"# ": "h1",
	"## ": "h2",
	"### ": "h3",
	"#### ": "h4",
	"##### ": "h5",
	"###### ": "h6",
	"---": "hr",
	"- ": "li",
	"+ ": "li",
	"* ": "li",
	">": "blockquote",
};

export const EmphasisTags = {
	"*": "em",
	_: "em",
	"**": "b",
	"***": "b",
	"==": "mark",
	"~~": "del",
	"~": "code",
};
