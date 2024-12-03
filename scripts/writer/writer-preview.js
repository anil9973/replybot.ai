import { AiRewriter } from "../../AI/rewriter.js";
import { AiWriter } from "../../AI/writer.js";
import { html } from "../../panel/js/om.event.js";
// @ts-ignore
import popupCss from "./style/writer-preview.css" with { type: "css" };

export class AiWriterPreviewPopup extends HTMLElement {
	constructor() {
		super();
	}

	/** @type {HTMLElement}*/
	inputFieldElem;

	/** @param {string} message*/
	async rewriteRequest(message, context) {
		try {
			await this.aiRewriter.rewriteTextStream(message, context, this.writingPad);
		} catch (error) {
			alert(error.message);
			this.hidePopover();
		}
	}

	async writeRequest(message, context) {
		try {
			await this.aiWriter.writeTextStream(message, context, this.writingPad);
		} catch (error) {
			alert(error.message);
			this.hidePopover();
		}
	}

	insertWriteContent(e) {
		this.dispatchEvent(new CustomEvent("insertaicontent", { detail: this.writingPad["innerText"] }));
	}

	sendInstruction({ currentTarget }) {
		const message = currentTarget.previousElementSibling.value;
		this.rewriteRequest(message);
		currentTarget.previousElementSibling.value = "";
	}

	onInputFieldKeyup({ shiftKey, code, target }) {
		if (code === "Enter") shiftKey || (this.rewriteRequest(target.value), (target.value = ""));
	}

	copyTextContent({ currenTarget }) {
		navigator.clipboard
			.writeText(this.writingPad["innerText"])
			.then(() => (currenTarget.setAttribute("class", "copied"), toast(i18n("note_content_copied"))))
			.catch((err) => alert(err.message));
	}

	render() {
		return html`<mark-writer-pad contenteditable="true" spellcheck="true"></mark-writer-pad>
			<action-bar>
				<textarea placeholder="rewrite instruction" @keyup=${this.onInputFieldKeyup.bind(this)}></textarea>
				<svg class="stop" viewBox="0 0 24 24" @click=${this.sendInstruction.bind(this)}>
					<title>${i18n("rewrite_instruction")}</title>
					<path />
				</svg>
				<svg class="copy" viewBox="0 0 24 24" @click=${this.copyTextContent.bind(this)} hidden>
					<title>${i18n("copy")}</title>
					<path />
				</svg>
				<button @mousedown=${this.insertWriteContent.bind(this)}>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="currentColor" d="M14 16V5l-1 1v9H1V3h9l1-1H0v14z"/><path fill="currentColor" d="M16 1.4L14.6 0L7.8 6.8L6 5v5h5L9.2 8.2z"/></svg>
					<span>${i18n("insert")}</span>
				</button>
			</action-bar>`;
	}

	async connectedCallback() {
		this.setAttribute("popover", "");
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [popupCss];
		this.shadowRoot.replaceChildren(this.render());
		this.writingPad = this.shadowRoot.firstElementChild;
		this.showPopover();
		this.aiWriter = new AiWriter();
		this.aiRewriter = new AiRewriter();
	}
}

customElements?.define("aiwriter-preview-popup", AiWriterPreviewPopup);
