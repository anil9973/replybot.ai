import { getSync, NOT_AVAILABLE, setSync } from "../panel/js/constant.js";
import { parseMarkDomStream } from "./parser.js";
import { AISummaryType } from "./enums.js";

export class Summarizer {
	constructor() {}

	static async checkAvailability() {
		const canSummarize = await ai.summarizer.capabilities();
		if (!canSummarize || canSummarize.available === "no") return NOT_AVAILABLE;
		return canSummarize.available;
	}

	async changeSummaryType(type = AISummaryType.KEY_POINTS) {
		await setSync({ summaryType: type });
		await this.summarizer?.destroy();
		await this.createSummarizer(null, type);
	}

	async createSummarizer(context, summaryType, length = "medium") {
		context && (this.context = context);
		summaryType ??= (await getSync("summaryType")).summaryType ?? AISummaryType.KEY_POINTS;
		this.summarizer = await ai.summarizer.create({ type: summaryType, sharedContext: context, length });
	}

	/** @param {string} inputText, @returns {Promise<string>}*/
	async summarize(inputText, context) {
		this.abortController = new AbortController();
		const signal = this.abortController.signal;
		this.summarizer ?? (await this.createSummarizer(context, { signal }));
		return this.summarizer.summarize(inputText);
	}

	/** @param {string} inputText*/
	async summarizeStream(inputText, context, writerHTMLElem) {
		try {
			this.summarizer ?? (await this.createSummarizer(context));
			this.abortController = new AbortController();
			const signal = this.abortController.signal;
			const readStream = await this.summarizer.summarizeStreaming(inputText, { signal });
			return parseMarkDomStream(readStream, writerHTMLElem);
		} catch (error) {
			console.error(error);
		}
	}

	stop() {
		this.abortController?.abort();
	}
}
