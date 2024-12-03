import { PromptMessenger } from "../../../AI/prompt-message.js";
import { Summarizer } from "../../../AI/summarizer.js";
import { extractPageContent } from "../../js/extractor.js";
import { html } from "../../js/om.event.js";

export class ExtractPageAction extends HTMLDialogElement {
	constructor(pageUrl) {
		super();
		this.pageUrl = pageUrl;
	}

	replyCustomer() {
		this.addToContext();
		const selection = getSelection();
		if (selection.isCollapsed) return;
		const textData = selection.toString()?.trim();
		if (!textData) return;
		chrome.tabs.sendMessage(waTabId, { command: "send_message_to_open_chat", replyMessage: textData });
	}

	addToContext() {
		const message = { command: "add_open_chat_context_data", contextData: this.firstElementChild["innerText"] };
		chrome.tabs.sendMessage(waTabId, message);
		this.remove();
	}

	async summarizeWebpage(message, pageContent) {
		try {
			this.aiPromptSummarizer = new PromptMessenger();
			const prompts = [{ role: "user", content: pageContent }];
			await this.aiPromptSummarizer.createPromptSession("Webpage summarizer", prompts);
			await this.aiPromptSummarizer.promptMessageStream(message, null, null, this.firstElementChild);
		} catch (error) {
			notify(error.message, "message");
		}
	}

	async extractPageContent() {
		if (!URL.canParse(this.pageUrl)) return notify("Invalid error");
		const origin = new URL(this.pageUrl).origin + "/*";
		const granted = await chrome.permissions.request({ origins: [origin] });
		if (!granted) return alert(i18n("permission_denied"));

		/* try {
			const response = await fetch(this.pageUrl, { method: "GET", redirect: "error" });
			const message = `Customer support agents need to extract specific reference information from the provided URL when assisting customers. Extract relevant details such as pricing, order details, product details, product delivery status, or address based on the customer's query. For example, if a customer asks 'Where is my order?', retrieve the order's delivery status from the page URL. If the customer wants to know product details, extract the relevant product information from the provided URL. Output language is ${navigator.language}`;
			this.summarizeWebpage(message, this.pageUrl);
		} catch (error) { */
		async function onUpdate(_, info, tab) {
			if (tab.id === tabId && info.status === "complete") {
				chrome.tabs.onUpdated.removeListener(onUpdate);
				const pageContent = await extractPageContent(tabId);
				// const context = `Customer support agents need to extract specific reference information from the provided source text when assisting customers. Extract relevant details such as pricing, order details, product details, product delivery status, or address based on the customer's query. For example, if a customer asks 'Where is my order?', retrieve the order's delivery status from the source text. If the customer wants to know product details, extract the relevant product information from the provided source text. Output language is ${navigator.language}`;
				const context = `Customer support agents need to extract specific reference information from the provided source text when assisting customers. Summarize following contents. Keep Important information`;
				this.summarizeWebpage(context, pageContent.slice(0, 4000));
			}
		}
		chrome.tabs.onUpdated.addListener(onUpdate.bind(this));
		const tabId = (await chrome.tabs.create({ url: this.pageUrl, active: false })).id;
		// }
	}

	render() {
		return html`<mark-writer-pad contenteditable="true" spellcheck="true"></mark-writer-pad>
		<div class="action-box">
            <button @click=${this.remove.bind(this)} title="Close popup">❌</button>
            <button @click=${this.replyCustomer.bind(this)} title="">${i18n("reply_customer")}</button>
            <button @click=${this.addToContext.bind(this)} title="">${i18n("add_to_context")}</button>
        </div>`;
	}

	async connectedCallback() {
		const canSummarize = await Summarizer.checkAvailability();
		if (canSummarize === "Not available") return alert(i18n("summary_api_not_available"));
		if (canSummarize === "after-download") notify(i18n("summarizer_downloading_in_progress"));
		this.id = "extract-page-action";
		this.replaceChildren(this.render());
		this.showModal();
		this.aiSummarizer = new Summarizer();
		this.extractPageContent();
	}
}

customElements.define("extract-page-action", ExtractPageAction, { extends: "dialog" });
