import { BlockMarkerTags, Brackets, EmphasisTags } from "./enums.js";
import { Tokenizer } from "./Tokenizer.js";

/**Parse markdown stream content to HTML DOM */
export class MarkdownParser {
	constructor() {
		this.inlineMarkerStack = [];
		this.blockElemStack = [];
		this.tokenizer = new Tokenizer();
		this.nestLayer = 0;
		this.setListener();
	}

	/**@param {ReadableStream<Uint8Array>} fileStream  */
	async *parseStream(fileStream) {
		const stream = fileStream;
		const reader = stream.getReader();
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				this.contentFrag = new DocumentFragment();
				this.blockElemStack.length === 0 && (this.currentLine = []);
				this.blockElemStack.splice(0, 1, this.contentFrag);
				this.tokenizer.consume(value);
				yield this.contentFrag;
			}
		} catch (err) {
			throw new Error("Failed to parse content", { cause: err });
		} finally {
			reader.releaseLock();
		}
	}

	/**@param {string} buffer, @returns {Promise<DocumentFragment>} */
	parse(buffer) {
		this.tokenizer.reset();
		this.inlineMarkerStack = [];
		this.blockElemStack = [];
		this.currentLine = [];
		this.nestLayer = 0;
		this.contentFrag = new DocumentFragment();
		this.blockElemStack.splice(0, 1, this.contentFrag);
		setTimeout(() => this.tokenizer.consume(buffer), 0);
		return new Promise((resolve, reject) => {
			this.tokenizer.on("finish", () => resolve(this.contentFrag));
			this.tokenizer.on("error", reject);
		});
	}

	insertFrontMatter(content) {
		/* const properties = content.split("\n");
		const metaDataProperties = new Map();
		for (const metaData of properties) {
			const [key, value] = metaData.split(": ");
			key && metaDataProperties.set(key, value);
		}
		this.contentFrag.prepend(new FrontMatter(metaDataProperties)); */
	}

	insertNewLine() {
		if (this.blockElemStack.at(-1).tagName?.startsWith("H")) this.blockElemStack.pop();
		if (this.blockElemStack.at(-1).tagName === "P" && this.currentLine.length === 0) this.blockElemStack.pop();

		if (this.currentLine.length === 0 && this.blockElemStack.length > 1) this.blockElemStack.pop();
		this.currentLine.length = 0;
		this.inlineMarkerStack.length = 0;
	}

	insertIndent() {
		this.nestLayer++;
	}

	insertStartMarker(marker) {
		const tagName = BlockMarkerTags[marker] ? BlockMarkerTags[marker] : +marker[0] ? "li" : "p";
		if (this.blockElemStack.at(-1).tagName === "BLOCKQUOTE")
			return this.currentLine.push(this.blockElemStack.at(-1));
		const blockElem = document.createElement(tagName);

		//header and hr tag
		if (tagName[0] === "h") this.blockElemStack.splice(1);
		else if (tagName === "li") {
			let nestLayer = (this.blockElemStack.at(-1).nestLayer ?? 0) - this.nestLayer;
			if (nestLayer > 0) while (nestLayer--) this.blockElemStack.pop();

			const parentElem = this.blockElemStack.at(-1);
			if (parentElem.tagName !== "UL" && parentElem.tagName !== "OL") {
				const listType = +marker[0] ? "ol" : "ul";
				const listElem = document.createElement(listType);
				this.blockElemStack.at(-1).appendChild(listElem);
				this.blockElemStack.push(listElem);
			}

			blockElem.nestLayer = this.blockElemStack.length - 1;
			this.nestLayer = 0;
		}

		this.blockElemStack.at(-1).appendChild(blockElem);
		this.blockElemStack.push(blockElem);
		const textSpan = document.createElement("span");
		blockElem.appendChild(textSpan);
		this.currentLine.push(textSpan);
	}

	insertParagraph() {
		let blockElem;
		if (this.blockElemStack.at(-1).tagName === "P") blockElem = this.blockElemStack.at(-1);
		else {
			this.blockElemStack.length > 1 && this.blockElemStack.pop();
			blockElem = document.createElement("P");
			this.blockElemStack.at(-1).appendChild(blockElem);
			this.blockElemStack.push(blockElem);
		}
		return blockElem;
	}

	insertText(text) {
		if (this.currentLine.length === 0) {
			const paragraph = this.insertParagraph();
			const textSpan = document.createElement("span");
			textSpan.textContent = text;
			paragraph.appendChild(textSpan);
			this.currentLine.push(textSpan);
		} else if (this.currentLine.at(-1).nodeType === 1) this.currentLine.at(-1).appendChild(new Text(text));
	}

	insertTwinMarker(marker) {
		const lastMarker = this.inlineMarkerStack.at(-1)?.marker;
		if (lastMarker === marker || Brackets[lastMarker] === marker) {
			this.inlineMarkerStack.pop();
			this.currentLine.pop();
		} else {
			this.currentLine.length === 0 && this.currentLine.push(this.insertParagraph());
			const tagName = EmphasisTags[marker];
			const markerElem = document.createElement(tagName);
			markerElem.marker = marker;
			this.inlineMarkerStack.length === 0
				? this.currentLine.at(-1).appendChild(markerElem)
				: this.inlineMarkerStack.at(-1).appendChild(markerElem);
			this.inlineMarkerStack.push(markerElem);
			this.currentLine.push(markerElem);
		}
	}

	insertHashTag(text) {
		const tagElem = document.createElement("span");
		tagElem.className = "hashtag";
		tagElem.appendChild(new Text(text));

		this.currentLine.length === 0
			? this.insertParagraph().appendChild(tagElem)
			: this.currentLine.at(-1).appendChild(tagElem);
	}

	insertLink(srcUrl, linkTitle) {
		const aElem = document.createElement("a");
		aElem.href = srcUrl;
		typeof linkTitle === "string"
			? (aElem.textContent = linkTitle)
			: aElem.appendChild(this.insertImg(linkTitle.imgUrl, linkTitle.imgAlt));
		this.currentLine.length === 0
			? this.insertParagraph().appendChild(aElem)
			: this.currentLine.at(-1).appendChild(aElem);
	}

	insertImg(srcUrl, alt) {
		const img = new Image();
		img.src = srcUrl;
		img.alt = alt;
		this.currentLine.length === 0
			? this.insertParagraph().appendChild(img)
			: this.currentLine.at(-1).appendChild(img);
		return img;
	}

	insertWikiLink(link) {
		/* const openSqrBracket = new TwinMarker("[[", null);
		const linkElem = document.createElement("span");
		linkElem.textContent = link;
		const closeSqrBracket = new TwinMarker("]]", openSqrBracket);
		openSqrBracket.twinMarker = closeSqrBracket;
		this.currentLine.append(openSqrBracket, linkElem, closeSqrBracket); */
	}

	insertfootNoteRef(link) {
		/* const openSqrBracket = new TwinMarker("[^", null);
		const linkElem = document.createElement("span");
		linkElem.textContent = link;
		const closeSqrBracket = new TwinMarker("]", openSqrBracket);
		openSqrBracket.twinMarker = closeSqrBracket;
		this.currentLine.append(openSqrBracket, linkElem, closeSqrBracket); */
	}

	insertFenceBlock(content, isEnd) {
		this.blockElemStack.length > 1 && this.blockElemStack.pop();
		if (this.openBlock) {
			this.openBlock.appendChild(new Text(content));
			isEnd && (this.openBlock = null);
		} else {
			this.openBlock = document.createElement("pre");
			this.openBlock.appendChild(new Text(content));
			this.contentFrag.appendChild(this.openBlock);
		}
	}

	insertMathBlock(content, isEnd) {
		/* if (this.openBlock) {
			isEnd && (content = content.slice(0, -3));
			this.openBlock.pre.appendChild(new Text(content));
			isEnd && (this.openBlock = null);
		} else {
			this.openBlock = new MathBlock(content);
			this.currentLine.replaceWith(this.openBlock);
		} */
	}

	insertTable(tableHeads) {
		this.blockElemStack.length > 1 && this.blockElemStack.pop();
		const table = document.createElement("table");
		const tHead = table.createTHead();
		const headRow = tHead.insertRow();

		for (const data of tableHeads) {
			const cell = headRow.insertCell();
			cell.appendChild(new Text(data));
		}
		this.openTableBody = table.createTBody();
		this.contentFrag.appendChild(table);
	}

	insertTableRow() {
		this.openTableBody.insertRow();
	}

	insertTableCell(cellText) {
		const cell = this.openTableBody.lastElementChild["insertCell"]();
		cell.appendChild(new Text(cellText));
	}

	insertHTML(htmlStr, isBlock) {
		//this.currentLine.insertAdjacentHTML(isBlock ? "afterend" : "beforeend", htmlStr);
	}

	insertComment(commentStr) {
		//this.currentLine.appendChild(new XmlComment(commentStr));
	}

	insertObsidianComment(commentStr) {
		//this.currentLine.appendChild(new ObsidianComment(commentStr));
	}

	setListener() {
		this.tokenizer.on("frontmatter", this.insertFrontMatter.bind(this));
		this.tokenizer.on("newline", this.insertNewLine.bind(this));
		this.tokenizer.on("indent", this.insertIndent.bind(this));
		this.tokenizer.on("startmarker", this.insertStartMarker.bind(this));
		this.tokenizer.on("text", this.insertText.bind(this));
		this.tokenizer.on("spantext", this.insertText.bind(this));
		this.tokenizer.on("twinmarker", this.insertTwinMarker.bind(this));
		this.tokenizer.on("hashTag", this.insertHashTag.bind(this));
		this.tokenizer.on("linkurl", this.insertLink.bind(this));
		this.tokenizer.on("image", this.insertImg.bind(this));
		this.tokenizer.on("wikilink", this.insertWikiLink.bind(this));
		this.tokenizer.on("footnoteref", this.insertfootNoteRef.bind(this));
		this.tokenizer.on("fenceblock", this.insertFenceBlock.bind(this));
		this.tokenizer.on("mathblock", this.insertMathBlock.bind(this));
		this.tokenizer.on("table", this.insertTable.bind(this));
		this.tokenizer.on("addtablerow", this.insertTableRow.bind(this));
		this.tokenizer.on("addtablecell", this.insertTableCell.bind(this));
		this.tokenizer.on("inserthtml", this.insertHTML.bind(this));
		this.tokenizer.on("insertcomment", this.insertComment.bind(this));
		this.tokenizer.on("obsidiancomment", this.insertObsidianComment.bind(this));
	}
}
