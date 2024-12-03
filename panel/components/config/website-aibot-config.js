import { AIAutoReply } from "./auto-reply.js";
import { TrainAiBot } from "./train-ai-bot.js";
import { html } from "../../js/om.event.js";
import { ScheduleNotify } from "./notify-schedule.js";
import { writerconfigOptions } from "./writer-config.js";
// @ts-ignore
import aibotConfigCss from "../../style/aibot-config.css" with { type: "css" };
document.adoptedStyleSheets.push(aibotConfigCss);

export class WebsiteAibotConfig extends HTMLElement {
	constructor() {
		super();
	}

	onBusinessNameChange({ target }) {
		setStore({ businessName: target.value });
		globalThis.businessName = target.value;
	}

	render() {
		const businessNameElem = html`<label style="display:block;text-align:center"> <span>${i18n("business_name")}: </span> <input type="text" value="${globalThis.businessName}" @change=${this.onBusinessNameChange.bind(this)}></label>`;
		return [businessNameElem, new ScheduleNotify(), new writerconfigOptions(), new AIAutoReply(), new TrainAiBot()];
	}

	async connectedCallback() {
		globalThis.businessName = (await getStore("businessName")).businessName ?? "";
		this.replaceChildren(...this.render());
	}
}

customElements.define("website-aibot-config", WebsiteAibotConfig);
