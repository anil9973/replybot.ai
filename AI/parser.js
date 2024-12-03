import { MarkdownParser } from "../scripts/summarizer/parser/mark-htmldom/parser.js";

/** @param {string} text @param {HTMLElement} writerHTMLElem*/
export async function parseMarkDom(text, writerHTMLElem) {
	const markParser = new MarkdownParser();
	const contentFrag = await markParser.parse(text);
	contentFrag && writerHTMLElem.appendChild(contentFrag);
}

/** @param {ReadableStream<string>} readStream*/
export async function parseMarkDomStream(readStream, writerHTMLElem) {
	let previousChunk = "";
	const transformStream = new TransformStream({
		transform(chunk, controller) {
			const newChunk = chunk.startsWith(previousChunk) ? chunk.slice(previousChunk.length) : chunk;
			if (!newChunk) return;
			controller.enqueue(newChunk);
			previousChunk = chunk;
		},

		flush() {
			dispatchEvent(new Event("markstreamcomplete"));
		},
	});
	const stream = readStream.pipeThrough(transformStream);
	writerHTMLElem.replaceChildren();

	const markParser = new MarkdownParser();
	for await (const contentFrag of markParser.parseStream(stream)) {
		writerHTMLElem.appendChild(contentFrag);
	}
}

export async function insertTextStream(readStream, writerHTMLElem) {
	let previousChunk = "";
	for await (const chunk of readStream) {
		const newChunk = chunk.startsWith(previousChunk) ? chunk.slice(previousChunk.length) : chunk;
		if (writerHTMLElem) writerHTMLElem.appendChild(new Text(newChunk));
		else {
			const textChunks = newChunk.split("\n");
			for (const textChunk of textChunks) {
				// document.execCommand("insertLineBreak", null, null); //FIX not working
				document.execCommand("insertText", null, textChunk);
				getSelection().collapseToEnd();
			}
		}
		previousChunk = chunk;
	}
}

/** @param {string} markText*/
export function extractJSONContent(markText) {
	markText = markText.trim();
	let jsonStartIndex = markText.indexOf("```json");
	if (jsonStartIndex === -1) return markText;

	jsonStartIndex = jsonStartIndex + 7;
	const blockEndIndex = markText.indexOf("```", jsonStartIndex);
	const jsonContent = markText.slice(jsonStartIndex, blockEndIndex);
	return JSON.parse(jsonContent.trim());
}
