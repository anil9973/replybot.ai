import { html } from "../../js/om.event.js";

export class AddConversationData extends HTMLElement {
	constructor() {
		super();
	}

	async addConversationData() {
		const textData = this.inputField.value;
		const chatMoreData = (await getStore(conversationId))[conversationId] ?? {};
		chatMoreData.chatMoreData = textData;
		setStore({ [conversationId]: chatMoreData });
		chrome.tabs.sendMessage(waTabId, { msg: "add_chat_more_data", data: textData });
	}

	/** @param {FileSystemFileHandle[]} fileHandles */
	async readFiles(fileHandles) {
		fileHandles.forEach(async (fileHandle, index) => {
			const file = await fileHandle.getFile();
			const reader = new FileReader();
			reader.onload = async (evt) => {
				const content = evt.target.result;
				this.inputField.value += `\n===${file.type}===\n${content}\n===${file.type}===`;
				if (index === fileHandles.length - 1) this.addConversationData();
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
			console.warn(error.message);
		}
	}

	render(textData) {
		const placeholder = `Order details:\nProduct or service name`;
		return html`<label><atom-icon ico="database-edit" title=""></atom-icon> ${i18n("add_conversation_data")}</label>
            <textarea placeholder="${placeholder}" ref=${(node) => (this.inputField = node)} @change=${this.addConversationData.bind(this)}>${textData}</textarea>
			<atom-icon ico="attachment-plus" title="" @click=${this.pickFiles.bind(this)}></atom-icon>`;
	}

	async connectedCallback() {
		const chatMoreData = (await getStore(conversationId))[conversationId]?.chatMoreData ?? "";
		this.replaceChildren(this.render(chatMoreData));
	}
}

customElements.define("add-conversation-data", AddConversationData);
