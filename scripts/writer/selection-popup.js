import { getSync, setSync } from "../../panel/js/constant.js";
import { html } from "../../panel/js/om.compact.js";
// @ts-ignore
import selectionCss from "./style/selection-popup.css" with { type: "css" };

export class EditFieldSelectionPopup extends HTMLElement {
	constructor() {
		super();
	}

	/** @type {Range} */
	range;
	/** @type {Set<string>}*/
	static pinnedActions;
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

	insertWriteContent({ detail }) {
		//biome-ignore format:
		getSelection().setBaseAndExtent(this.range.startContainer, this.range.startOffset, this.range.endContainer, this.range.endOffset);
		document.execCommand("insertText", null, detail);
		this.hidePopover();
	}

	setPosition(popupElem) {
		popupElem.style.left = this.style.left;
		popupElem.style.top = `calc(${this.style.top} - 100px)`;
	}

	async openTranslatorPopup() {
		const sourceTxtData = this.range.cloneContents().textContent;
		if (!sourceTxtData) return;
		const importUrl = chrome.runtime.getURL("/scripts/translator/translator-popup.js");
		const { TranslatorPopup } = await import(importUrl);
		const translatorPopup = document.createElement("translator-popup");
		const descriptors = Object.getOwnPropertyDescriptors(TranslatorPopup.prototype);
		Object.defineProperties(translatorPopup, descriptors);
		this.shadowRoot.appendChild(translatorPopup);
		translatorPopup["connectedCallback"]();
		translatorPopup["translateText"](sourceTxtData);
		this.setPosition(translatorPopup);
	}

	async openWriterPopup(request) {
		const sourceTxtData = this.range.cloneContents().textContent;
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

	improve() {
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
		const item = (action) => html`<svg
			class="${action.icon}"
			viewBox="0 0 24 24"
			@click=${this[action.func].bind(this)}>
			<title>${action.title}</title>
			<path />
		</svg>`;
		//biome-ignore format:
		const actions = EditFieldSelectionPopup.actions.filter((action) => EditFieldSelectionPopup.pinnedActions.has(action.icon));
		const moreBtn = html`<label>
				<input type="checkbox" name="toggle-more-action" hidden />
				<svg class="chev-down" viewBox="0 0 24 24" style="margin-left: 8px">
					<title>${i18n("more_actions")}</title>
					<path />
				</svg>
			</label>`;
		return [...actions.map(item), moreBtn];
	}

	async connectedCallback() {
		this.setAttribute("popover", "");
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [selectionCss];
		//biome-ignore format:
		EditFieldSelectionPopup.pinnedActions = new Set((await getSync("pinnedSelectEditFieldActions")).pinnedSelectEditFieldActions ?? ["auto-fix", "translate",  "explain", "done"]);
		this.shadowRoot.replaceChildren(...this.render());
		this.shadowRoot.lastElementChild.addEventListener("change", this.appendMoreAction, { once: true });
		this.showPopover();
	}

	appendMoreAction({ target }) {
		const moreActionPopup = document.createElement("editfield-select-more-action");
		const descriptors = Object.getOwnPropertyDescriptors(EditFieldSelectMoreAction.prototype);
		Object.defineProperties(moreActionPopup, descriptors);
		target.after(moreActionPopup);
		moreActionPopup["connectedCallback"]();
		// @ts-ignore
		moreActionPopup.addEventListener("runactionfunc", ({ detail: funcName }) => this[funcName]?.());
	}
}

customElements?.define("editfield-selection-popup", EditFieldSelectionPopup);

export class EditFieldSelectMoreAction extends HTMLElement {
	constructor() {
		super();
	}

	runActionFunc(funcName) {
		this.dispatchEvent(new CustomEvent("runactionfunc", { detail: funcName }));
	}

	async updatePin(itemId, event) {
		const isPinned = EditFieldSelectionPopup.pinnedActions.has(itemId);
		isPinned
			? EditFieldSelectionPopup.pinnedActions.delete(itemId)
			: EditFieldSelectionPopup.pinnedActions.add(itemId);
		event.currentTarget.setAttribute("class", isPinned ? "pin" : "pinned");
		event.stopImmediatePropagation();
		if (isPinned) {
			//TODO
		}
		setSync({ pinnedSelectEditFieldActions: [...EditFieldSelectionPopup.pinnedActions] });
	}

	render() {
		const item = (action) => html`<li  @click=${this.runActionFunc.bind(this, action.func)}>
			<svg class="${action.icon}" viewBox="0 0 24 24">
				<title>${action.title}</title>
				<path />
			</svg>

			<span>${action.title}</span>

			<svg class="${EditFieldSelectionPopup.pinnedActions.has(action.icon) ? "pinned" : "pin"}" viewBox="0 0 24 24" @click=${this.updatePin.bind(this, action.icon)}>
				<title>${i18n("toggle_pin")}</title>
				<path />
			</svg>
		</li> `;
		return EditFieldSelectionPopup.actions.map(item);
	}

	connectedCallback() {
		this.replaceChildren(...this.render());
	}
}

customElements?.define("editfield-select-more-action", EditFieldSelectMoreAction);
