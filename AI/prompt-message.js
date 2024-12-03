import { parseMarkDomStream, insertTextStream, parseMarkDom } from "./parser.js";
import { generateContentOnGeminiServer } from "./Gemini-api.js";
import { NOT_AVAILABLE } from "../panel/js/constant.js";

export class PromptMessenger {
	constructor() {}

	static async checkAvailability() {
		const canPrompt = await ai.languageModel.capabilities();
		if (!canPrompt || canPrompt.available === "no") return NOT_AVAILABLE;
		return canPrompt.available;
	}

	/** @param {string} systemRole @param {{role:string, content:string}[]} [initialPrompts] */
	async createPromptSession(systemRole = "", initialPrompts = []) {
		this.userPrompts = initialPrompts;
		systemRole += `\nOutput language: ${navigator.language}`;
		this.session = await ai.languageModel.create({ systemPrompt: systemRole, initialPrompts });
	}

	/** @param {string} message*/
	async promptMessage(message, systemRole, initialPrompts) {
		this.abortController = new AbortController();
		const signal = this.abortController.signal;

		try {
			this.session ?? (await this.createPromptSession(systemRole, initialPrompts));
			return await this.session.prompt(message, { signal });
		} catch (error) {
			if (error.code === 9) {
				return await generateContentOnGeminiServer(`${this.userPrompts[0].content}\n${message}`);
			} else if (error.code !== 20) throw new Error("Failed to response prompt message", { cause: error });
		}
	}

	/** @public */
	async promptMessageStream(message, systemRole, initialPrompts, writerHTMLElem) {
		this.abortController = new AbortController();
		const signal = this.abortController.signal;

		try {
			this.session ?? (await this.createPromptSession(systemRole, initialPrompts));
			const readStream = this.session.promptStreaming(message, { signal });
			return await parseMarkDomStream(readStream, writerHTMLElem);
		} catch (error) {
			console.error(error);
			console.dir(error);
			if (error.code === 9 || error.cause?.code === 9) {
				const text = await generateContentOnGeminiServer(`${this.userPrompts[0].content}\n${message}`);
				text && parseMarkDom(text, writerHTMLElem);
			} else if (error.code !== 20) throw new Error("Failed to response prompt message", { cause: error });
		}
	}

	async promptTextMsgStream(message, systemRole, initialPrompts, writerHTMLElem) {
		this.abortController = new AbortController();
		const signal = this.abortController.signal;

		try {
			this.session ?? (await this.createPromptSession(systemRole, initialPrompts));
			const readStream = this.session.promptStreaming(message, { signal });
			await insertTextStream(readStream, writerHTMLElem);
		} catch (error) {
			if (error.cause.code === 9) {
				const text = await generateContentOnGeminiServer(`${this.userPrompts[0].content}\n${message}`);
				text && writerHTMLElem
					? writerHTMLElem.appendChild(new Text(text))
					: document.execCommand("insertText", null, text);
			} else if (error.code !== 20) throw new Error("Failed to response prompt message", { cause: error });
		}
	}

	stop() {
		this.abortController?.abort();
	}

	destroy() {
		this.session.destroy();
	}
}
