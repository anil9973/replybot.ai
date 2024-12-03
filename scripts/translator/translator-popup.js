import { Translator } from "../../AI/translator.js";
import { react, html } from "../../panel/js/om.compact.js";
// @ts-ignore
import languages from "/assets/languages.json" with { type: "json" };
// @ts-ignore
import popupCss from "./translator-popup.css" with { type: "css" };

const getStore = chrome.storage.local.get.bind(chrome.storage.local);
const setStore = chrome.storage.local.set.bind(chrome.storage.local);
/**@type {chrome.i18n.getMessage} */
const i18n = chrome.i18n.getMessage.bind(this);
/** @param {string} lang*/
const fixLangCode = (lang) => (languages[lang] ? lang : lang?.split("-", 1)[0].toLowerCase());

export class TranslatorPopup extends HTMLElement {
	constructor() {
		super();
		this.props = react({ transTextData: "" });
	}

	/**@param {string} sourceTxtData*/
	async translateText(sourceTxtData) {
		try {
			this.sourceTxtData = sourceTxtData;
			this.translator = new Translator();
			const canDetectLang = await Translator.checkLangDetectAvailability();

			// if (canDetectLang === "Not available") return alert("Cannot detect language");
			await this.translator.createLangDetector();
			//biome-ignore format:
			this.fromLang = canDetectLang === "readily" ?  (await this.translator.detectLang(this.sourceTxtData.slice(0, 120))) : fixLangCode(document.documentElement.lang);
			this.toLang ??= (await getStore("toLang")).toLang || fixLangCode(navigator.language);

			const canTranslate = await Translator.checkAvailability(this.fromLang, this.toLang);
			if (canTranslate === "Not available") return alert("Translator not available");

			this.translator = new Translator();
			await this.translator.createTranslator(this.fromLang, this.toLang);
			await this._translateText(this.fromLang, this.sourceTxtData);
			this.shadowRoot.replaceChildren(this.render());
			this.showPopover();
		} catch (error) {
			alert(error.message);
		}
	}

	async _translateText(from, textData = this.sourceTxtData) {
		const translatedText = await this.translator.translate(textData, from, this.toLang);
		this.props.transTextData = translatedText;
	}

	onFromLangChange(event) {
		this.fromLang = event.target.value;
		this._translateText(this.fromLang);
	}

	translateOutputData() {
		const fromLang = this.fromLang;
		this.fromLang = this.toLang;
		this.toLang = fromLang;
		this._translateText(this.fromLang, this.props.transTextData);
	}

	onToLangChange(event) {
		this.toLang = event.target.value;
		this._translateText(this.fromLang);
		setStore({ toLang: this.toLang });
	}

	replaceText() {
		this.dispatchEvent(new CustomEvent("insertaicontent", { detail: this.props.transTextData }));
	}

	copyText() {
		navigator.clipboard
			.writeText(this.props.transTextData)
			.then(() => toast("Copied"))
			.catch((err) => console.error(err));
	}

	async speak() {
		await chrome.runtime.sendMessage({ msg: "ttsSpeak", text: this.props.transTextData, lang: this.toLang });
	}

	render() {
		const languageList = Object.keys(languages);
		return html`<header>
				<svg
					viewBox="0 0 24 24"
					class=${() => (this.props.speakOrig ? "speaking" : "speak")}
					@click=${this.speak.bind(this, "orig")}>
					<title>${i18n("pronounce_translated_text")}</title>
					<path />
				</svg>

				<select
					name="original-lang"
					.value=${this.fromLang}
					@change=${this.onFromLangChange.bind(this)}>
					${languageList.map((lang) => `<option value="${lang}">${languages[lang]}</option>`).join("")}
				</select>

				<svg class="swap" viewBox="0 0 24 24" @click=${this.translateOutputData.bind(this)}>
					<title>${i18n("reverse_language")}</title>
					<path />
				</svg>

				<select
					name="translated-lang"
					.value=${() => this.toLang}
					@change=${this.onToLangChange.bind(this)}>
					${languageList.map((lang) => `<option value="${lang}">${languages[lang]}</option>`).join("")}
				</select>

				<svg viewBox="0 0 24 24" class="replace" style="right:24px" @pointerdown=${this.replaceText.bind(this)}>
					<title>${i18n("replace_src_text_with_translated")}</title>
					<path />
				</svg>
			</header>
			<article>
				<section>
					<textarea .value=${() => this.props.transTextData}></textarea>
				</section>
			</article>
			<output hidden></output>`;
	}

	async connectedCallback() {
		this.setAttribute("popover", "");
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [popupCss];
		this.props = react({ bookmarked: false, speakOrig: false, speakTrans: false });
	}
}

customElements?.define("translator-popup", TranslatorPopup);
