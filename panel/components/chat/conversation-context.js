import { AddConversationData } from "./add-conversation-data.js";
import { ExtractWebpages } from "./extract-webpages.js";
import { PrivateNotes } from "./private-notes.js";
import { AskwithMira } from "./ask-with-mira.js";
import { getTabs } from "../../js/constant.js";
import { html } from "../../js/om.event.js";
// @ts-ignore
import conversationContextCss from "../../style/conversation-context.css" with { type: "css" };
document.adoptedStyleSheets.push(conversationContextCss);

const tabId = (await getTabs({ active: true, currentWindow: true }))[0]?.id;
globalThis.waTabId = tabId;

export class ConversationContext extends HTMLElement {
	constructor() {
		super();
	}

	onAgentNameChange({ target }) {
		setStore({ agentname: target.value });
		globalThis.agentname = target.value;
	}

	render() {
		const agentNameElem = html`<label style="display:block;text-align:center"> <span>${i18n("agent_name")}: </span> <input type="text"  value="${globalThis.agentname}" @change=${this.onAgentNameChange.bind(this)}></label>`;
		return [agentNameElem, new ExtractWebpages(), new AddConversationData(), new PrivateNotes(), new AskwithMira()];
	}

	async connectedCallback() {
		globalThis.agentname = (await getStore("agentname")).agentname ?? "Ruby";
		this.replaceChildren(...this.render());
	}
}

customElements.define("conversation-context", ConversationContext);
