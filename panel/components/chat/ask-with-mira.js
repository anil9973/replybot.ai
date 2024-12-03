import { PromptMessenger } from "../../../AI/prompt-message.js";
import { html } from "../../js/om.event.js";

export class MessageCard extends HTMLElement {
	constructor(content = "") {
		super();
		this.content = content;
	}

	render() {
		return `<message-content>${this.content}</message-content>
        <message-action hidden> <atom-icon ico="copy" title=""></atom-icon> </message-action>`;
	}

	connectedCallback() {
		this.innerHTML = this.render();
	}
}

customElements.define("message-card", MessageCard);

export class PromptMessageField extends HTMLElement {
	constructor() {
		super();
	}

	promptMessenger = new PromptMessenger();

	async askQuestion({ shiftKey, code, target }) {
		if (shiftKey || code !== "Enter") return;
		try {
			if (!this.promptMessenger.session) {
				const { businessDocs } = await getStore("businessDocs");
				const prompts = [{ role: "user", content: businessDocs ?? "" }];
				await this.promptMessenger.createPromptSession("Assistant", prompts);
			}
			const messageBoxElem = new MessageCard();
			const promptMsg = target.value;
			target.value = "";
			this.previousElementSibling.append(new MessageCard(promptMsg), messageBoxElem);
			await this.promptMessenger.promptMessageStream(promptMsg, "", null, messageBoxElem.firstElementChild);
		} catch (error) {
			notify(error.message, "error");
		}
	}

	render() {
		return html`<textarea placeholder="${i18n("ask_question_hit_enter")}" @keyup=${this.askQuestion.bind(this)}></textarea>
		<atom-icon ico="attachment-plus" title=""></atom-icon>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
	}
}

customElements.define("message-writer-pad", PromptMessageField);

export class AskwithMira extends HTMLDetailsElement {
	constructor() {
		super();
	}

	render() {
		const header = html`<summary>
			<atom-icon ico="chat-question" title=""></atom-icon> <span>Ask with Mira</span>
		</summary>`;
		const messageList = document.createElement("message-list");
		return [header, messageList, new PromptMessageField()];
	}

	async connectedCallback() {
		const canPrompt = await PromptMessenger.checkAvailability();
		if (canPrompt === "Not available") return alert(i18n("prompt_api_not_available"));
		if (canPrompt === "after-download") notify(i18n("prompt_api_download"));

		this.open = true;
		this.replaceChildren(...this.render());
	}
}

customElements.define("ask-with-mira", AskwithMira, { extends: "details" });
