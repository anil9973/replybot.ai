// @ts-ignore
import writerSuggestionCss from "./style/writer-suggestion.css" with { type: "css" };

export class WriterSuggestionList extends HTMLElement {
	constructor() {
		super();
	}

	/** @type {HTMLElement}*/
	inputFieldElem;

	/** @public @param {string[]} suggestionList*/
	showSuggestionList(suggestionList) {
		this.suggestionList = suggestionList;
		this.shadowRoot.innerHTML = this.render();
		this.showPopover();
	}

	onClick(event) {
		event.stopImmediatePropagation();
		const liElem = event.target.closest("li");
		if (!liElem) return;
		getSelection().setPosition(this.inputFieldElem, 0);
		document.execCommand("insertText", null, liElem.textContent);
		this.hidePopover();
		/* const footerElem = document.querySelector("footer");
		const sendMessageButton = Array.prototype.at.call(footerElem.querySelectorAll("button"), -1);
		sendMessageButton.click(); */
	}

	onSelect({ target }) {
		this.inputFieldElem.textContent = target.nextElementSibling.textContent;
	}

	render() {
		const item = (message) =>
			`<li><label><input type="radio" name="ai-writer-suggestion" hidden><span>${typeof message === "string" ? message : message.response}</span></label></li>`;
		return this.suggestionList.map(item).join("");
	}

	connectedCallback() {
		this.setAttribute("popover", "");
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [writerSuggestionCss];
		// this.shadowRoot.addEventListener("change", this.onSelect.bind(this)); //not working on whatsapp
		this.shadowRoot.addEventListener("click", this.onClick.bind(this));
	}
}

customElements?.define("writer-suggestion-list", WriterSuggestionList);
