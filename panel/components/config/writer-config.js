import { html } from "../../js/om.event.js";

export class writerconfigOptions extends HTMLElement {
	constructor() {
		super();
	}

	render() {
		return html`<label>
                <span>${i18n("tone")}:</span>
				<select class="tone">
					<option value="formal">Formal</option>
					<option value="neutral">Neutral</option>
					<option value="casual">Casual</option>
				</select>
			</label>
			<label>
				<span>${i18n("format")}:</span>
				<select class="format">
					<option value="markdown">Markdown</option>
					<option value="plain-text" selected>Plain text</option>
				</select>
			</label>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
	}
}

customElements.define("writer-config-options", writerconfigOptions);
