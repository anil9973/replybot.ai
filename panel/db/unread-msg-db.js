import { rdmId } from "../js/util.js";
import { connect, Store } from "./db.js";

export class UnreadMessage {
	constructor(profileName, textContent, time) {
		this.id = rdmId();
		this.profileName = profileName;
		this.textContent = textContent;
		this.time = time;
	}
}

/**@returns {Promise<UnreadMessage[]>} */
export async function pipeUnreadMessageList() {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const transaction = db.transaction(Store.UnreadMessages, "readonly");
			const unreadMessageStore = transaction.objectStore(Store.UnreadMessages);
			const fetchQuery = unreadMessageStore.getAll();
			fetchQuery.onsuccess = ({ target }) => resolve(target["result"]);
			fetchQuery.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@param {UnreadMessage} unreadMessage*/
export async function insertUnreadMessageInDb(unreadMessage) {
	console.log(unreadMessage);
	return new Promise((resolve, reject) => {
		connect().then(async (db) => {
			unreadMessage.id ??= rdmId();
			const store = db.transaction(Store.UnreadMessages, "readwrite").objectStore(Store.UnreadMessages);
			const putTask = store.put(unreadMessage);
			putTask.onsuccess = (e) => resolve(e);
			putTask.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@param {string} profileName*/
export async function deleteUnreadMessagesInDb(profileName) {
	return new Promise((resolve, reject) => {
		connect().then(async (db) => {
			const transaction = db.transaction(Store.UnreadMessages, "readwrite");
			const unreadMessageStore = transaction.objectStore(Store.UnreadMessages);
			const chatIndex = unreadMessageStore.index("profileName");
			const fetchQuery = chatIndex.getAll(IDBKeyRange.only(profileName));
			fetchQuery.onsuccess = ({ target }) => {
				const unreadMessages = target["result"];
				for (const unreadMessage of unreadMessages) unreadMessageStore.delete(unreadMessage.id);
			};
			transaction.oncomplete = (e) => resolve(e);
			transaction.onerror = (e) => reject(e);
			db.close();
		});
	});
}
