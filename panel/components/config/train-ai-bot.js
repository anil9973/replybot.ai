import { PromptMessenger } from "../../../AI/prompt-message.js";
import { html } from "../../js/om.event.js";

export class TrainAiBot extends HTMLElement {
	constructor() {
		super();
	}

	async onBusinessDocsUrlInput({ target }) {
		const businessName = "XYZ company";
		const message = `Visit every link within the company documentation pages provided at the following URL: '${target.value}' for ${businessName}. Generate a concise summary of the key information most relevant to customer support agents who are resolving customer queries. Focus on highlighting any important policies, procedures, and troubleshooting steps that should be referenced when assisting customers. The output should be in the language '${navigator.language}', and avoid providing explanations or examples.`;
		try {
			this.aiPromptSummarizer = new PromptMessenger();
			const prompts = [{ role: "user", content: JSON.stringify({ businessName, businessUrl: target.value }) }];
			await this.aiPromptSummarizer.createPromptSession("Business documentation webpage summarizer", prompts);
			const businessDocs = await this.aiPromptSummarizer.promptMessage(message);
			setStore({ businessDocs });
		} catch (error) {
			notify(error.message, "error");
		}
	}

	onTextFieldEdit({ target }) {
		setStore({ businessDetails: target.value });
	}

	/** @param {FileSystemFileHandle[]} fileHandles*/
	async readFiles(fileHandles) {
		const businessInfoFiles = (await getStore("businessInfoFiles")).businessInfoFiles;
		fileHandles.forEach(async (fileHandle) => {
			const file = await fileHandle.getFile();
			const reader = new FileReader();
			reader.onload = async (evt) => {
				const content = evt.target.result;
				businessInfoFiles[file.name] = `\n===${file.type}===\n${content}\n===${file.type}===`;
				setStore({ businessInfoFiles });
			};
			reader.readAsText(file);
		});
	}

	async pickFiles() {
		try {
			const types = [{ description: "Text file", accept: { "text/*": [".txt", ".md", ".html", , ".csv"] } }];
			/**@type {FileSystemFileHandle[]}*/
			// @ts-ignore
			const fileHandles = await showOpenFilePicker({ multiple: true, startIn: "documents", types });
			fileHandles.length === 0 || this.readFiles(fileHandles);
		} catch (error) {
			if (navigator["brave"] && error.message === "showDirectoryPicker is not defined") {
				toast(i18n("enable_file_access_api"));
				await new Promise((r) => setTimeout(r, 2000));
				return chrome.tabs.create({ url: "brave://flags/#file-system-access-api" });
			}
			notify(error.message, "error");
		}
	}

	render(placeholder) {
		return html`<label><atom-icon ico="ai-bot" title=""></atom-icon> ${i18n("replybot_training")}</label>
			<input type="url" placeholder="Enter business documetation url" @change=${this.onBusinessDocsUrlInput.bind(this)} />
            <textarea @change=${this.onTextFieldEdit.bind(this)}>${placeholder}</textarea>
			<atom-icon ico="attachment-plus" title="" @click=${this.pickFiles.bind(this)}></atom-icon>`;
	}

	async connectedCallback() {
		const placeholder = `Act as a customer support agent for XYZ company. Your name is Mira, and you should include your name in every response to provide a personalized touch. Every reply starts with this text: Namaste\n \nand ends with this text: \nBest regards\nYour name`;
		(await getStore("businessDetails")).businessDetails ?? setStore({ businessDetails: placeholder });
		this.replaceChildren(this.render(placeholder));
	}
}

customElements.define("train-ai-bot", TrainAiBot);
