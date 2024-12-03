import { Store, connect } from "./db.js";

export class Note {
	/**@param {string} conversationId */
	constructor(conversationId, agentName, txtContent = "") {
		this.id = crypto.randomUUID();
		this.conversationId = conversationId;
		this.agentName = agentName;
		this.txtContent = txtContent;
		this.createdAt = Date.now();
	}
}

/**@returns {Promise<Note[]>} */
export async function pipeNoteList(conversationId) {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const transaction = db.transaction(Store.Notes, "readonly");
			const noteStore = transaction.objectStore(Store.Notes);
			if (conversationId) {
				const chatIndex = noteStore.index("conversationId");
				const fetchQuery = chatIndex.getAll(IDBKeyRange.only(conversationId));
				fetchQuery.onsuccess = ({ target }) => resolve(target["result"]);
				fetchQuery.onerror = (e) => reject(e);
			} else {
				const fetchQuery = noteStore.getAll();
				fetchQuery.onsuccess = ({ target }) => resolve(target["result"]);
				fetchQuery.onerror = (e) => reject(e);
			}
			db.close();
		});
	});
}

/**@param {Note} note*/
export async function insertNoteInDb(note) {
	return new Promise((resolve, reject) => {
		connect().then(async (db) => {
			const store = db.transaction(Store.Notes, "readwrite").objectStore(Store.Notes);
			const archiveTask = store.put(note);
			archiveTask.onsuccess = (e) => resolve(e);
			archiveTask.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@param {Set<string>|string[]} noteIds*/
export async function deleteNotesInDb(noteIds) {
	return new Promise((resolve, reject) => {
		connect().then(async (db) => {
			const transaction = db.transaction(Store.Notes, "readwrite");
			const noteStore = transaction.objectStore(Store.Notes);
			for (const noteId of noteIds) noteStore.delete(noteId);
			transaction.oncomplete = (e) => resolve(e);
			transaction.onerror = (e) => reject(e);
			db.close();
		});
	});
}
