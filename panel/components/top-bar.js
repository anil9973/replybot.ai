import { html } from "../js/om.event.js";
// @ts-ignore
import topbarCss from "../style/top-bar.css" with { type: "css" };
document.adoptedStyleSheets.push(topbarCss);

export class TopBar extends HTMLElement {
	constructor() {
		super();
	}

	openTab(index) {
		$("[active]", this)?.removeAttribute("active");
		this.children[index].setAttribute("active", "");
		$("main").children[index].scrollIntoView();
	}

	render() {
		return html`<tab-item id="configuration"  @click=${this.openTab.bind(this, 0)} active><atom-icon ico="configuration" title=""></atom-icon> <span>Configuration</span></tab-item>
		<tab-item id="conversation"  @click=${this.openTab.bind(this, 1)}><atom-icon ico="conversation" title="Open conversation"></atom-icon> <span>Context</span></tab-item>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
	}
}

customElements.define("top-bar", TopBar);
