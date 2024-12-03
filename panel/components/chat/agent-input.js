import { html } from "../../js/om.event.js";

export class AgentInput extends HTMLElement {
	constructor(dynamicKeys) {
		super();
		this.dynamicKeys = dynamicKeys;
	}

	onSubmit() {
		const inputElems = this.children[1].querySelectorAll("input");
		//biome-ignore format:
		const values =  Array.prototype.reduce.call(inputElems, (acc,crt)=> { acc[crt.name] = crt.value; return acc }, {})
		fireEvent(this, "valueinput", values);
		this.remove();
	}

	render() {
		return html`<h3>${i18n("enter_required_value")}</h3>
        <ul>
            ${this.dynamicKeys.map((dynamicKey) => `<li><label><span>Enter value for ${dynamicKey}</span><input type="text" name="${dynamicKey}"></label></li>`).join("")}
        </ul>
        <button type="submit" @click=${this.onSubmit.bind(this)}>${i18n("done")}</button>`;
	}

	connectedCallback() {
		this.id = "agent-input-popup";
		this.setAttribute("popover", "manual");
		this.replaceChildren(this.render());
		this.showPopover();
	}
}

customElements.define("agent-input-popup", AgentInput);

//B0BT9CXXXX
