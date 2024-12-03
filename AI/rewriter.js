import { insertTextStream, parseMarkDomStream } from "./parser.js";
import { NOT_AVAILABLE } from "../panel/js/constant.js";
import { PromptMessenger } from "./prompt-message.js";

export class AiRewriter {
	constructor() {}

	static async checkAvailability() {
		const canPrompt = await ai.languageModel.capabilities();
		if (!canPrompt || canPrompt.available === "no") return NOT_AVAILABLE;
		return canPrompt.available;
	}

	async createRewriter(context) {
		this.rewriter = await ai.rewriter.create({ sharedContext: context });
	}

	/** @param {string} message*/
	async rewrite(message, context) {
		this.rewriter ?? (await this.createRewriter(context));
		this.abortController = new AbortController();
		const signal = this.abortController.signal;
		try {
			return await this.rewriter.rewrite(message, { context, signal });
		} catch (error) {
			console.error(error);
			console.dir(error);
			if (error.code === 9 || error.name === "NotReadableError") {
				if (!this.promptWriter) {
					this.promptWriter = new PromptMessenger();
					const prompts = [{ role: "user", content: this.rewriter.sharedContext }];
					await this.promptWriter.createPromptSession("Text Rewriter", prompts);
				}
				return await this.promptWriter.promptMessage(message);
			} else if (error.code !== 20) throw new Error("Failed to rewrite content", { cause: error });
		}
	}

	/** @public */
	async rewriteStream(message, context, writerHTMLElem) {
		this.rewriter ?? (await this.createRewriter(context));
		try {
			this.abortController = new AbortController();
			const signal = this.abortController.signal;
			const readStream = this.rewriter.rewriteStreaming(message, { context, signal });
			return await parseMarkDomStream(readStream, writerHTMLElem);
		} catch (error) {
			console.error(error);
			if (error.cause?.name === "NotReadableError") return this.rewrite(message);
			if (error.cause.code !== 20) throw new Error("Failed to rewrite content", { cause: error });
		}
	}

	/** @public */
	async rewriteTextStream(message, context, writerHTMLElem) {
		this.rewriter ?? (await this.createRewriter(context));
		try {
			this.abortController = new AbortController();
			const signal = this.abortController.signal;
			const readStream = this.rewriter.rewriteStreaming(message, { context, signal });
			await insertTextStream(readStream, writerHTMLElem);
		} catch (error) {
			console.error(error);
			if (error.code === 9 || error.cause?.name === "NotReadableError") {
				const role = "Text Rewriter";
				if (!this.promptRewriter) {
					this.promptRewriter = new PromptMessenger();
					const prompts = [{ role: "user", content: this.rewriter.sharedContext }];
					await this.promptRewriter.createPromptSession(role, prompts);
				}
				this.promptRewriter.promptTextMsgStream(message, role, null, writerHTMLElem);
				this.abortController = this.promptRewriter.abortController;
			} else if (error.cause.code !== 20) throw new Error("Failed to rewrite content", { cause: error });
		}
	}

	stop() {
		this.abortController?.abort();
	}

	destroy() {
		this.rewriter.destroy();
	}
}
