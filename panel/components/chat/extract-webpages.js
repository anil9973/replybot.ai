import { html, map, react } from "../../js/om.compact.js";
import { ExtractPageAction } from "./extract-page-action.js";
import { extractDynamicKeys, rdmId } from "../../js/util.js";
import { AgentInput } from "./agent-input.js";

export class ExtractWebpages extends HTMLDetailsElement {
	constructor() {
		super();
	}

	onDynamicValueInput(pageUrl, dynamicProps) {
		const keyRx = new RegExp(/\[\[([^,]+).*\]\]/g);
		const matches = pageUrl.matchAll(keyRx);
		//biome-ignore format:
		matches?.forEach((match) => pageUrl = pageUrl.substring(0, match.index) + dynamicProps[match[1]] + pageUrl.substring(match.index+ match[0].length));
		const extractPageElem = new ExtractPageAction(pageUrl);
		document.body.appendChild(extractPageElem);
	}

	async extractUrlPage({ target }) {
		const button = target.closest("button");
		if (!button) return;
		const id = target.parentElement.parentElement.id;
		const linkObj = this.extractPageUrls.find((link) => link.id === id);
		if (linkObj.ask_agent.length !== 0) {
			const inputDialog = new AgentInput(linkObj.ask_agent);
			document.body.appendChild(inputDialog);
			$on(inputDialog, "valueinput", ({ detail }) => this.onDynamicValueInput(linkObj.url, detail));
		} else if (linkObj.ask_customer.length !== 0) {
			const message = { command: "ask_customer_dynamic_value", dynamicKeys: linkObj.ask_customer };
			const dynamicValues = await chrome.tabs.sendMessage(waTabId, message);
			dynamicValues && this.onDynamicValueInput(linkObj.url, dynamicValues);
		}
	}

	async onUrlInput({ target }) {
		if (target.name !== "link-url") return;
		const index = this.extractPageUrls.findIndex((link) => link.url === target.value);
		if (target.value && index !== -1) return (target.value = "");
		//Add next input field
		const nextLiElem = target.closest("li").nextElementSibling;
		if (!nextLiElem || !$('input[type="url"]', nextLiElem).value)
			this.extractPageUrls.push({ id: rdmId(), url: "", title: "" });
		//Save URLs
		const extractPageUrls = (await getStore("extractPageUrls")).extractPageUrls ?? [];
		const id = target.parentElement.parentElement.id;
		const idx = extractPageUrls.findIndex((link) => link.id === id);
		if (target.value) {
			const obj = { id: rdmId(), url: target.value, title: target.parentElement.previousElementSibling.value };
			extractDynamicKeys(target.value, obj);
			extractPageUrls.splice(idx, 1, obj);
		} else extractPageUrls.splice(idx, 1);
		await setStore({ extractPageUrls });
	}

	render(extractPageUrls) {
		const linkeElem = (link) =>
			html`<li id="${link.id}"> <input type="text" placeholder="title" value=${link.title}> <label><input type="url" name="link-url" value="${link.url}" placeholder="Enter url pattern for webpage" /> <button>Extract</button></label></li>`;
		return html`<summary>
				<atom-icon ico="web-plus" title=""></atom-icon> <span>${i18n("extract_webpages")}</span>
				<details class="url-pattern-info">
					<summary><atom-icon ico="info" title=""> </atom-icon></summary>
					<section>
						<p><strong>${i18n("how_url_patterns_work")}</strong></p>
						<p>
							You can define URL patterns for ReplyBot AI to extract conversation-specific data dynamically. These
							patterns use placeholders that ReplyBot will replace with actual values based on the conversation
							context.
						</p>
						<h3>URL Patterns Format:</h3>
						<pre>[[dynamic_key_name,ask_agent]] \n [[dynamic_key_name,ask_customer]]</pre>
						<ul>
							<li>
								<code>dynamic_key_name</code>: A placeholder representing the data you want ReplyBot to extract
								(e.g., ASIN).
							</li>
							<li>
								<code>ask_customer</code> or <code>ask_agent</code>: Specifies whether ReplyBot should ask the
								customer or the agent for the value if it is not found in the conversation history.
							</li>
						</ul>
						<h3>${i18n("example_of_url_patterns")}:</h3>
						<ol>
							<li>
								<code>https://www.amazon.in/gp/product/[[ASIN,ask_agent]]/info</code>
								<ul>
									<li>${i18n("replybot_will_extract_the_ASIN")}</li>
								</ul>
							</li>
							<li>
								<code>https://www.amazon.in/gp/your-account/order-details/orderID=[[ASIN,ask_customer]]</code>
								<ul>
									<li>
										${i18n("if_the_customer_has_provided_the_ASIN")}
									</li>
								</ul>
							</li>
						</ol>
						<h3>How It Works:</h3>
						<ol>
							<li>
								<strong>Data Extraction</strong>: ReplyBot scans the conversation history for the
								<code>dynamic_key</code> (e.g., ASIN).
							</li>
							<li>
								<strong>Replacing Placeholder</strong>: If the <code>dynamic_key_value</code> is found (e.g., the
								ASIN), ReplyBot automatically replaces the <code>dynamic_key_name</code> with the corresponding
								value in the URL.
							</li>
							<li>
								<strong>Fetching Content</strong>: ReplyBot uses the updated URL to fetch the webpage content,
								which is added to the conversation to provide additional context or information.
							</li>
							<li>
								<strong>Handling Missing Data</strong>: If the <code>dynamic_key_name</code> is not found in the
								conversation history:
								<ul>
									<li>
										ReplyBot will prompt the agent or customer (based on your configuration) to provide the value.
									</li>
									<li>
										Once the value is received, ReplyBot will use it to extract data from the webpage as described
										above.
									</li>
								</ul>
							</li>
						</ol>
						<p> This process allows ReplyBot to dynamically gather relevant information from URLs and incorporate it into the conversation seamlessly.</p>
					</section>
				</details>
			</summary>
			<ul class="extract-url-list"  @change=${this.onUrlInput.bind(this)} @click=${this.extractUrlPage.bind(this)}>${map(extractPageUrls, linkeElem)}</ul>`;
	}

	async connectedCallback() {
		this.id = "extract-webpages";
		const extractPageUrls = (await getStore("extractPageUrls")).extractPageUrls ?? [];
		extractPageUrls.push({ id: rdmId(), url: "", title: "" });
		this.extractPageUrls = react(extractPageUrls);
		this.open = true;
		this.replaceChildren(this.render(this.extractPageUrls));
	}
}

customElements.define("extract-webpages", ExtractWebpages, { extends: "details" });
