export const Store = {
	Notes: "Notes",
	UnreadMessages: "UnreadMessages",
};

function onupgradeneeded({ target }) {
	const noteStore = target.result.createObjectStore(Store.Notes, { keyPath: "id" });
	noteStore.createIndex("conversationId", "conversationId", { unique: false });

	const unreadMsg = target.result.createObjectStore(Store.UnreadMessages, { keyPath: "id" });
	unreadMsg.createIndex("profileName", "profileName", { unique: false });
}

/**@returns {Promise<IDBDatabase>} */
export function connect() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open("reply-bot", 1);
		request.onupgradeneeded = onupgradeneeded;
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
		request.onblocked = () => console.warn("pending till unblocked");
	});
}
