export const AISummaryType = {
	TD_LR: "tl;dr",
	KEY_POINTS: "key-points",
	TEASER: "teaser",
	HEADLINE: "headline",
};

export const AISummaryTypes = new Set(["key-points", "tl;dr", "teaser", "headline"]);

export const AISummaryFormat = {
	PLAIN_TEXT: "plain-text",
	MARKDOWN: "markdown",
};

export const AIWriterTone = {
	FORMAL: "formal",
	NEUTRAL: "neutral",
	CASUAL: "casual",
};

export const AIRewriterTone = {
	AS_IS: "as-is",
	MORE_FORMAL: "more-formal",
	MORE_CASUAL: "more-casual",
};
