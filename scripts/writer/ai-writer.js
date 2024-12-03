import { html } from "../../panel/js/om.event.js";
// @ts-ignore
import aiWriterCss from "./style/ai-writer.css" with { type: "css" };

export class MiraAiWriter extends HTMLElement {
	constructor() {
		super();
	}

	static actions = [
		{
			icon: "auto-fix",
			title: i18n("improve"),
			func: "improve",
		},

		{
			icon: "translate",
			title: i18n("translate"),
			func: "translateText",
		},

		{
			icon: "grammar",
			title: i18n("fix_grammar"),
			func: "fixGrammer",
		},

		{
			icon: "collapse",
			title: i18n("make_shorter"),
			func: "makeShorter",
		},

		{
			icon: "simplify",
			title: i18n("simplify"),
			func: "simplify",
		},
		{
			icon: "expand",
			title: i18n("make_longer"),
			func: "makeLonger",
		},

		{
			icon: "done",
			title: i18n("finish_writing"),
			func: "finishWriting",
		},
	];

	/** @type {HTMLElement}*/
	inputFieldElem;

	insertWriteContent({ detail: textContent }) {
		const index = textContent.indexOf(" ");
		const text1 = textContent.slice(0, index);
		const text2 = textContent.slice(index);
		getSelection().selectAllChildren(this.inputFieldElem);
		document.execCommand("insertText", null, text1);
		const onInput = (e) => e.stopImmediatePropagation();
		this.inputFieldElem.addEventListener("input", onInput, { capture: true, once: true });
		document.execCommand("insertText", null, text2);
		document.execCommand("insertText", null, text2);
		this.hidePopover();
	}

	setPosition(popupElem) {
		popupElem.style.left = `calc(${this.style.left} + ${this.offsetWidth / 2}px)`;
		popupElem.style.bottom = innerHeight - (this.offsetTop + this.offsetHeight) + "px";
	}

	async openTranslatorPopup() {
		const importUrl = chrome.runtime.getURL("/scripts/translator/translator-popup.js");
		const { TranslatorPopup } = await import(importUrl);
		const translatorPopup = document.createElement("translator-popup");
		const descriptors = Object.getOwnPropertyDescriptors(TranslatorPopup.prototype);
		Object.defineProperties(translatorPopup, descriptors);
		this.shadowRoot.appendChild(translatorPopup);
		translatorPopup["connectedCallback"]();
		translatorPopup["translateText"](this.inputFieldElem.textContent);
		translatorPopup.addEventListener("insertaicontent", this.insertWriteContent.bind(this));
		this.setPosition(translatorPopup);
	}

	async openWriterPopup(request) {
		const sourceTxtData = this.inputFieldElem.textContent;
		if (!sourceTxtData) return;
		try {
			if (!this.aiWriterPreviewPopup) {
				const context = `Without adding any explanations or examples, improve the provided text content. The input text is: '${sourceTxtData}'`;
				const importUrl = chrome.runtime.getURL("/scripts/writer/writer-preview.js");
				const { AiWriterPreviewPopup } = await import(importUrl);
				/**@type {AiWriterPreviewPopup} */
				this.aiWriterPreviewPopup = document.createElement("aiwriter-preview-popup");
				const descriptors = Object.getOwnPropertyDescriptors(AiWriterPreviewPopup.prototype);
				Object.defineProperties(this.aiWriterPreviewPopup, descriptors);
				this.shadowRoot.appendChild(this.aiWriterPreviewPopup);
				await this.aiWriterPreviewPopup.connectedCallback();
				this.setPosition(this.aiWriterPreviewPopup);
				this.aiWriterPreviewPopup.inputFieldElem = this.inputFieldElem;
				this.aiWriterPreviewPopup.addEventListener("insertaicontent", this.insertWriteContent.bind(this));
				await this.aiWriterPreviewPopup.aiWriter.createWriter(context);
				await this.aiWriterPreviewPopup.aiRewriter.createRewriter(context);
			} else this.aiWriterPreviewPopup.showPopover();

			request === "Complete writing based on"
				? await this.aiWriterPreviewPopup.writeRequest(request)
				: request && (await this.aiWriterPreviewPopup.rewriteRequest(request));
		} catch (error) {
			console.error(error);
		}
	}

	improve(e) {
		this.openWriterPopup("Improve");
	}

	translateText() {
		this.openTranslatorPopup();
	}

	fixGrammer() {
		this.openWriterPopup("Fix Grammar");
	}

	makeShorter() {
		this.openWriterPopup("Make shorter");
	}

	simplify() {
		this.openWriterPopup("Simply");
	}

	makeLonger() {
		this.openWriterPopup("Make longer");
	}

	finishWriting() {
		this.openWriterPopup("Complete writing based on");
	}

	render() {
		const item = (action) => html`<li @click=${this[action.func].bind(this)}>
			<svg class="${action.icon}" viewBox="0 0 24 24">
				<title>${action.title}</title>
				<path />
			</svg>

			<span>${action.title}</span>
		</li>`;

		return MiraAiWriter.actions.map(item);
	}

	connectedCallback() {
		this.setAttribute("popover", "");
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [aiWriterCss];
		this.shadowRoot.replaceChildren(...this.render());
		this.showPopover();
	}
}

customElements?.define("mira-ai-writer", MiraAiWriter);
