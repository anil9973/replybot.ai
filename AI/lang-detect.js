export class LanguageDetector {
	constructor() {}

	static async checkAvailability() {
		const canDetect = await ai.languageDetector.capabilities();
		if (!canDetect || canDetect.available === "no") return "Not available";
		return canDetect.available;
	}

	async createLangDetect() {
		this.langDetector = await ai.languageDetector.create();
	}

	async detectLang(sourceText) {
		this.langDetector ?? (await this.createLangDetect());
		const results = await this.langDetector.detect(sourceText);
		if (results && results[0].confidence > 0.2) return results[0].detectedLanguage;
	}
}
