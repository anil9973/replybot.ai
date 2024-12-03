export const langRx = new RegExp(
	/[-\s](c|cpp|charp|go|html|css|js|jsx|ts|json|kotlin|kt|java|py|python|r|rust|sass|scss|sql|vue|xml)/,
);
export const escapeRx = new RegExp(/[\s:|?<>/~#^*\[\]]/g);
export const blockTags = new Set(["BLOCKQUOTE", "LI", "DD"]);

export const BlockElemTags = new Set([
	"ADDRESS",
	"ARTICLE",
	"ASIDE",
	"BLOCKQUOTE",
	"DD",
	"DIV",
	"DL",
	"DT",
	"FIGCAPTION",
	"FOOTER",
	"HEADER",
	"H1",
	"H2",
	"H3",
	"H4",
	"H5",
	"H6",
	"LI",
	"OL",
	"UL",
	"HR",
	"MAIN",
	"NAV",
	"P",
	"SECTION",
]);

export const TableElemTags = new Set(["TABLE", "THEAD", "TH", "TBODY", "TD", "TFOOT"]);

export const BlockMarkerClass = {
	H1: "header-1",
	H2: "header-2",
	H3: "header-3",
	H4: "header-4",
	H5: "header-5",
	H6: "header-6",
	LI: "list",
	BLOCKQUOTE: "quote",
	HR: "divider",
};

export const BlockClassMarker = {
	list: "- ",
	quote: ">",
	"task-list": `- [ ] `,
	description: ": ",
	"header-1": "# ",
	"header-2": "## ",
	"header-3": "### ",
	"header-4": "#### ",
	"header-5": "##### ",
	"header-6": "###### ",
	li: "- ",
};

export const BlockMarker = {
	H1: "#",
	H2: "##",
	H3: "###",
	H4: "####",
	H5: "#####",
	H6: "######",
	LI: "-",
	BLOCKQUOTE: ">",
	HR: "---",
};

export const InlineElemTags = new Set([
	"ABBR",
	"B",
	"BDO",
	"CITE",
	"CODE",
	"DFN",
	"DEL",
	"EM",
	"INS",
	"I",
	"KBD",
	"LABEL",
	"OUTPUT",
	"Q",
	"SAMP",
	"SMALL",
	"SPAN",
	"STRONG",
	"SUB",
	"SUP",
	"VAR",
]);

export const headerTags = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);

export const InlineMarkerClass = {
	B: "bold",
	CITE: "italic",
	CODE: "code",
	DEL: "strikethrough",
	DFN: "italic",
	EM: "italic",
	I: "italic",
	KBD: "code",
	MARK: "highlight",
	STRONG: "bold",
	VAR: "italic",
};

export const InlineClassMark = {
	italic: "*",
	bold: "**",
	"bold-italic": "***",
	highlight: "==",
	strikethrough: "~~",
	code: "`",
};

/* export const BlockTagMarker = {
	h1: "# ",
	h2: "## ",
	h3: "### ",
	h4: "#### ",
	h5: "##### ",
	h6: "###### ",
	li: "- ",
	blockquote: ">",
}; */

export const CtmTagName = {
	LineBlock: "LINE-BLOCK",
	StartMarker: "START-MARKER",
	EmbedLink: "EMBED-LINK",
	EmbedContent: "EMBED-CONTENT",
	BlockIndent: "BLOCK-INDENT",
	TwinMarker: "TWIN-MARKER",
	TimeStamp: "TIME-STAMP",
};

export const IgnoreByTag = new Set([
	"AREA",
	"BUTTON",
	"CANVAS",
	"COLGROUP",
	"COL",
	"DATALIST",
	"OPTION",
	"OPTGROUP",
	"LINK",
	"META",
	"METER",
	"FORM",
	"INPUT",
	"NOSCRIPT",
	"STYLE",
	"SCRIPT",
	"SOURCE",
	"svg",
	"SELECT",
	"TEXTAREA",
	"MAP",
	"PROGRESS",
	"TITLE",
	"WBR",
	"SEARCH",
]);
