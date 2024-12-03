import { html } from "../../js/om.event.js";

export class AIAutoReply extends HTMLDetailsElement {
	constructor() {
		super();
	}

	onChange({ target }) {
		const autoReplyType = target.value;
		setStore({ autoReplyType });
		chrome.tabs.sendMessage(waTabId, { msg: "set_autoReplyType", autoReplyType }).catch(() => {});
	}

	render() {
		return html`<summary> <atom-icon ico="auto-send" title=""></atom-icon> <span>${i18n("auto_reply")}</span></summary>
        <ul>
            <li><label><input type="radio" name="auto-reply" value="auto-reply" > <span>${i18n("auto_reply")}</span> </label> </li>
            <li><label><input type="radio" name="auto-reply" value="ask-before-reply" > <span>${i18n("ask_before_reply")}</span> </label></li>
            <li><label><input type="radio" name="auto-reply" value="suggest-reply" > <span>${i18n("suggest_upto_5_reply_messages")}</span> </label></li>
        </ul>`;
	}

	async connectedCallback() {
		const { autoReplyType } = await getStore("autoReplyType");
		const radioElem = $(`input[value="${autoReplyType}"]`, this);
		radioElem && (radioElem.checked = true);
		this.replaceChildren(this.render());
		this.open = true;
		$on(this, "change", this.onChange.bind(this));
	}
}

customElements.define("auto-reply", AIAutoReply, { extends: "details" });
