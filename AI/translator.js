import { NOT_AVAILABLE } from "../panel/js/constant.js";

const defaultLang = navigator.language?.split("-", 1)[0].toLowerCase();

export class Translator {
	constructor() {}

	//== Lang Detector =
	static async checkLangDetectAvailability() {
		const canDetect = await ai.languageDetector.capabilities();
		if (!canDetect || canDetect.available === "no") return "Not available";
		return canDetect.available;
	}

	async createLangDetector() {
		const status = await Translator.checkLangDetectAvailability();
		if (status !== "readily") console.info("Detect lang after download");
		this.langDetector = await ai.languageDetector.create();
	}

	async detectLang(sourceText) {
		this.langDetector ?? (await this.createLangDetector());
		const results = await this.langDetector.detect(sourceText);
		if (results && results[0].confidence > 0.2) return results[0].detectedLanguage;
	}
	//Lang Detector

	/** @param {string} sourceLanguage @param {string} targetLanguage*/
	static async checkAvailability(sourceLanguage, targetLanguage) {
		if (!self.translation || !self.translation.canTranslate) return;
		const languagePair = { sourceLanguage, targetLanguage };
		const canTranslate = await translation.canTranslate(languagePair);
		if (!canTranslate || canTranslate === "no") return NOT_AVAILABLE;
		return canTranslate;
	}

	/** @param {string} sourceLanguage @param {string} targetLanguage*/
	async createTranslator(sourceLanguage, targetLanguage) {
		this.sourceLang = sourceLanguage;
		this.targetLang = targetLanguage;
		const languagePair = { sourceLanguage, targetLanguage };
		this.translator = await ai.translator.create(languagePair);
	}

	/** @param {string} sourceText @param {string} [targetLang] @param {string} [sourceLang] */
	async translate(sourceText, targetLang, sourceLang) {
		try {
			targetLang ??= defaultLang;
			sourceLang ??= await this.detectLang(sourceText);
			if (sourceLang === targetLang) return;
			this.translator ?? (await this.createTranslator(sourceLang, targetLang));
			if (sourceLang !== this.sourceLang || targetLang !== this.targetLang)
				await this.createTranslator(sourceLang, targetLang);
			this.abortController = new AbortController();
			const signal = this.abortController.signal;
			return this.translator.translate(sourceText, { signal });
		} catch (error) {
			console.error(error);
		}
	}

	stop() {
		this.abortController?.abort();
	}
}
