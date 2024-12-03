import {
	BlockMarker,
	InlineClassMark,
	BlockElemTags,
	InlineMarkerClass,
	langRx,
	blockTags,
	IgnoreByTag,
} from "./enums.js";
import { trimLeft, trimStartArray } from "./util.js";

/** @description serialize html dom elements to texxt for download as .md file */
export class MarkTextSerializer {
	constructor() {}

	/**@param {NodeList} elements  */
	serialize(elements) {
		this.markdown = [];
		this.insertChildElements(elements);
		return trimStartArray(this.markdown).join("");
	}

	/**@param {NodeList} elements*/
	insertChildElements(elements, nestInfo) {
		for (let index = 0; index < elements.length; index++) {
			/**@type {HTMLElement} */
			// @ts-ignore
			const element = elements[index];
			if (element.nodeType === 3) {
				this.inserText(element);
				continue;
			} else if (element.nodeType !== 1) continue;

			const tagName = element["tagName"];

			if (IgnoreByTag.has(tagName)) continue;

			if (BlockElemTags.has(tagName)) {
				this.insertBlockElement(element, nestInfo, index + 1);
				continue;
			}

			if (tagName === "BR") {
				this.markdown.at(-1) === "\\\n" ? this.markdown.push("\n") : this.markdown.push("\\\n");
				continue;
			}

			if (tagName === "TABLE") {
				// @ts-ignore
				this.insertTable(element);
				continue;
			}

			if (tagName?.includes("-")) {
				const styleMap = element.computedStyleMap();
				const display = styleMap?.get("display").toString() ?? "inline";
				display.startsWith("inline")
					? this.insertInlineElement(element)
					: this.insertBlockElement(element, nestInfo, index + 1);
			} else this.insertInlineElement(element);
		}
	}

	insertInlineElement(element) {
		if (element.nodeType === 3) return this.inserText(element);
		const tagName = element.tagName;
		// biome-ignore format:
		if (InlineMarkerClass[tagName]) return this.insertInlineMarkElem(element, InlineMarkerClass[tagName]);
		if (this.elements[tagName]) return this.elements[tagName]?.(element);
		else for (const childElem of element.childNodes) this.insertInlineElement(childElem);
	}

	inserText(txtNode) {
		let text = txtNode.data;
		if (!text.trimStart()) return;
		if (text.startsWith("\n") || text.startsWith("\t")) {
			text = trimLeft(text);
			if (!text) return;
		}
		this.markdown.push(text ?? "");
	}

	elements = {
		A: this.insertLink.bind(this),
		IMG: this.insertImg.bind(this),
		AUDIO: this.insertMedia.bind(this),
		EMBED: this.insertMedia.bind(this),
		VIDEO: this.insertMedia.bind(this),
		OBJECT: this.insertMedia.bind(this),
		TR: this.insertTableRow.bind(this),
		TH: this.insertTableCell.bind(this),
		TD: this.insertTableCell.bind(this),
		math: this.insertMathMLContent.bind(this),
		"MJX-CONTAINER": (elem) => this.insertMathMLContent(elem.querySelector("math")),
		FIGURE: (elem) => this.insertImg(elem.querySelector("img")),
		PICTURE: (elem) => this.insertImg(elem.querySelector("img")),
		IFRAME: this.insertIframe.bind(this),
	};

	/**@param {Element} element */
	insertBlockElement(element, nestInfo, index) {
		const tagName = element.tagName;
		if (BlockMarker[tagName]) {
			tagName === "LI" || this.markdown.push("\n");
			this.insertBlockMarker(element, nestInfo, index);
			this.insertChildElements(element.childNodes, nestInfo);
			return this.markdown.push("\n");
		}
		if (tagName === "OL" || tagName === "UL") {
			this.markdown.push("\n");
			const type = tagName === "OL" ? "counter" : tagName === "UL" && "list";
			let _nestInfo;
			if (nestInfo) {
				_nestInfo = { ...nestInfo };
				_nestInfo.nestLevel ? ++_nestInfo.nestLevel : (_nestInfo.nestLevel = 1);
				_nestInfo.type = type;
			} else _nestInfo = { type };
			return this.insertChildElements(element.childNodes, _nestInfo);
		}
		if (tagName === "PRE") {
			const lang = element.className.match(langRx)?.[1] ?? "";
			this.markdown.push("\n```" + lang + "\n");
			this.markdown.push(element["innerText"]);
			return this.markdown.push("\n```\n");
		}

		if (tagName === "P" && !blockTags.has(element.parentElement?.tagName)) this.markdown.push("\n");
		else if (tagName === "DD") this.markdown.push("\n:\t");
		else if (tagName === "DT") this.markdown.push("\n");
		this.insertChildElements(element.childNodes);
	}

	/**@param {Element} element */
	insertBlockMarker(element, nestInfo, index) {
		let marker = BlockMarker[element.tagName];
		if (nestInfo) {
			nestInfo.type === "counter" && (marker = index + ".");
			nestInfo.nestLevel && this.markdown.push("\t".repeat(nestInfo.nestLevel));
		}
		this.markdown.push(marker + " ");
	}

	/**@param {Element} element */
	insertInlineMarkElem(element, type) {
		const mark = InlineClassMark[type];
		this.markdown.push(mark);
		for (const richElem of element.childNodes) this.insertInlineElement(richElem);
		this.markdown.push(mark + " ");
	}

	/**@param {Element} element */
	insertLink(element) {
		if (element.textContent.startsWith("\n")) return;
		if (element.childElementCount === 0) {
			const aLink = ` [${element.textContent}](${element["href"]}) `;
			this.markdown.push(aLink);
			// @ts-ignore
		} else if (element["href"].startsWith("#")) this.insertChildElements(element.children);
		else {
			this.markdown.push("[");
			this.insertChildElements(element.childNodes);
			this.markdown.push(`](${element["href"]})`);
		}
	}

	/**@param {Element} element */
	insertImg(element) {
		if (!element || element["width"] < 80) return;
		let src = element["currentSrc"] || element["src"];
		src.startsWith("data") && (src = element["dataset"].src || element["dataset"].srcset?.split(", ")[0]);
		const srcUrl = src.includes("?") ? src.split("?", 1)[0] : src;
		if (!srcUrl) return;
		const imgTxt = `\n![${element["alt"] ?? ""}](${srcUrl}) `;
		this.markdown.push(imgTxt);
	}

	/**@param {Element} element */
	insertMedia(element) {
		if (!element) return;
		const src = element["currentSrc"] || element["src"] || element.querySelector("source").src;
		const imgTxt = `\n![${src.slice(src.lastIndexOf("/") + 1)}](${src}) `;
		this.markdown.push(imgTxt);
	}

	/**@param {HTMLTableElement} element */
	insertTable(element) {
		this.markdown.push("\n");
		const rows = element.rows;
		if (rows.length === 0) return;
		const tHead = rows[0];
		this.insertTableRow(tHead);
		for (const rowElem of tHead.children) this.markdown.push("|" + "-".repeat(rowElem.textContent?.length ?? 3));
		this.markdown.push("|\n");

		for (let index = 1; index < rows.length; index++) this.insertTableRow(rows[index]);
	}

	/** @param {HTMLTableRowElement} tableRow*/
	insertTableRow(tableRow) {
		if (!tableRow) return;
		for (const rowElem of tableRow.children) this.insertInlineElement(rowElem);
		this.markdown.push("|\n");
	}

	insertTableCell(tableRow) {
		this.markdown.push("|");
		for (const cellElem of tableRow.childNodes) this.insertInlineElement(cellElem);
	}

	/**@param {MathMLElement} element*/
	insertMathMLContent(element) {
		const mark = "\n$$\n";
		const annotation = element.querySelector("annotation")?.textContent;
		annotation
			? this.markdown.push(mark + element.querySelector("annotation").textContent + mark)
			: this.markdown.push(`\n${element.outerHTML}\n`);
	}

	/**@param {HTMLIFrameElement} iframe*/
	insertIframe(iframe) {
		const elements = iframe.contentDocument?.querySelector("body").children;
		// @ts-ignore
		elements && this.insertChildElements(elements);
	}
}
