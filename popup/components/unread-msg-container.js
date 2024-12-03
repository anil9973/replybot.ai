import { pipeUnreadMessageList, UnreadMessage } from "../../panel/db/unread-msg-db.js";
import { UnreadMessageCard } from "./unread-message.js";

export class UnreadMsgContainer extends HTMLElement {
	constructor() {
		super();
	}

	/** @param {UnreadMessage[][]} unreadMessageGroups*/
	render(unreadMessageGroups) {
		return unreadMessageGroups.map((unreadMessages) => new UnreadMessageCard(unreadMessages));
	}

	async connectedCallback() {
		const unreadMessages = await pipeUnreadMessageList();
		const unreadMessageGroups = Object.groupBy(unreadMessages, ({ profileName }) => profileName);
		this.replaceChildren(...this.render(Object.values(unreadMessageGroups)));
	}
}

customElements.define("unread-msg-container", UnreadMsgContainer);
