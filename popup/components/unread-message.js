import { UnreadMessage } from "../../panel/db/unread-msg-db.js";
import { html } from "../../panel/js/om.event.js";

const chatProfilePics = (await getStore("chatProfilePics")).chatProfilePics ?? {};
const openChatProfile = await chrome.runtime.sendMessage("getOpenChatProfile");
const askToReply = (await getStore("autoReplyType")).autoReplyType === "ask-before-reply";

export class UnreadMessageCard extends HTMLElement {
	/** @param {UnreadMessage[]} unreadMessages*/
	constructor(unreadMessages) {
		super();
		this.profileName = unreadMessages[0].profileName;
		this.unreadMessages = unreadMessages;
	}

	async sendReply() {
		await chrome.runtime.sendMessage({ command: "sendOpenChatReply", replyText: this.textarea.value });
	}

	render() {
		const profilePic = chatProfilePics[this.profileName] ?? "/assets/whatsapp.png";
		return html`<profile-header> <img src="${profilePic}"> <span>${this.profileName}</span> </profile-header>
        <message-list>${this.unreadMessages.map((message) => `<li><div>${message.textContent}</div> <time>${message.time}</time></li>`).join("")}</message-list>
        <message-reply-box hidden=${askToReply && openChatProfile !== this.profileName}>
            <message-input-field> <textarea></textarea> </message-input-field>
            <button @click=${this.sendReply.bind(this)}><atom-icon ico="send" title="Reply"></atom-icon> <span>${i18n("reply")}</span></button>
        </message-reply-box>`;
	}

	async connectedCallback() {
		this.replaceChildren(this.render());
		if (askToReply && openChatProfile !== this.profileName) {
			const replyText = await chrome.runtime.sendMessage("getGeneratedReply");
			this.textarea = $("textarea", this);
			this.textarea.value = replyText;
		}
	}
}

customElements.define("unread-message", UnreadMessageCard);
