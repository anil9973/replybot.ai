/**@type {chrome.tabs.query} */
export const getTabs = chrome.tabs?.query.bind(chrome.tabs),
	/**@type {chrome.storage.StorageArea['get']} */
	getSync = chrome.storage.sync.get.bind(chrome.storage.sync),
	/**@type {chrome.storage.StorageArea['set']} */
	setSync = chrome.storage.sync.set.bind(chrome.storage.sync),
	/**@type {chrome.storage.StorageArea['get']} */
	getSession = chrome.storage.session.get.bind(chrome.storage.session),
	/**@type {chrome.storage.StorageArea['set']} */
	setSession = chrome.storage.session.set.bind(chrome.storage.session),
	escapeRx = new RegExp(/[\s:|?<>/~#^*\[\]]/g);

export const THEME_URL = "https://crxextstatic.blob.core.windows.net/themes/",
	WEBSTORE_ERR = "The extensions gallery cannot be scripted.",
	HOST_ACCESS_ERR = "Extension manifest must request permission to access this host.",
	NOT_AVAILABLE = "Not available";

export const tabgroupColors = ["blue", "red", "yellow", "green", "cyan", "purple", "pink", "orange", "grey"];
