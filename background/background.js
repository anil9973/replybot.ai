import { deleteUnreadMessagesInDb, insertUnreadMessageInDb } from "../panel/db/unread-msg-db.js";
import { getTabs } from "../panel/js/constant.js";
import { getCrtTab } from "../panel/js/extractor.js";

globalThis.getStore = chrome.storage.local.get.bind(chrome.storage.local);
globalThis.setStore = chrome.storage.local.set.bind(chrome.storage.local);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.msg === "saveUnreadMessage") {
		insertUnreadMessageInDb(request.unreadMessage).then(sendResponse);
		return true;
	} else if (request.msg === "deleteUnreadMessage") {
		//biome-ignore format:
		deleteUnreadMessagesInDb(request.profileName).then((deleteCount)=> chrome.action.getBadgeText({}).then((text) => chrome.action.setBadgeText({ text: String(Math.max(0,(+text || 0) - deleteCount)) }))).then(sendResponse);
		return true;
	} else if (request === "openWhatsappTab") openWhatsappTab();
	else if (request === "openPopup") openUnreadMsgPopup();
	else if (request.msg === "plusMsgCountBadge") {
		chrome.action.getBadgeText({}).then((text) => {
			const count = String((+text || 0) + 1);
			count && chrome.action.setBadgeText({ text: count });
			text || chrome.action.setBadgeBackgroundColor({ color: "#ffcc00" });
		});
	} else if (request.msg === "ttsSpeak") chrome.tts.speak(request.text, { lang: request.lang, enqueue: true });
	else if (request.msg === "openSP_chatContext") openSidePanel(request.conversationId, sender.tab.id);
});

async function openSidePanel(conversationId, waTabId) {
	await chrome.sidePanel.open({ tabId: waTabId });
	await new Promise((r) => setTimeout(r, 2000));
	chrome.runtime.sendMessage({ msg: "open_chat_context", conversationId });
}

async function openWhatsappTab(tab) {
	tab && (await chrome.sidePanel.open({ tabId: tab.id }));
	tab ??= await getCrtTab();
	const url = "https://web.whatsapp.com/";
	const waTab = (await getTabs({ url }))[0];
	waTab
		? await chrome.tabs.update(waTab.id, { active: true })
		: await chrome.tabs.create({ url, index: tab.index + 1 });
	chrome.storage.session.set({ lastTabId: tab.id });
}

async function openUnreadMsgPopup(tab) {
	tab ??= await getCrtTab();
	await chrome.action.setPopup({ popup: "popup/index.html", tabId: tab.id });
	await chrome.action.openPopup();
	await chrome.action.setPopup({ popup: "", tabId: tab.id });
}

chrome.action.onClicked.addListener(openWhatsappTab);

//command-handler
const commands = {
	openUnreadMsgPopup,
	switchToPrevTab: async () => {
		const { lastTabId } = await chrome.storage.session.get("lastTabId");
		chrome.tabs.update(lastTabId, { active: true });
	},
};
chrome.commands.onCommand.addListener((command) => commands[command]?.());

//installation
export const setInstallation = ({ reason }) => {
	async function oneTimeInstall() {
		const businessDetails = `Act as a customer support agent for XYZ company. Your name is Mira, and you should include your name in every response to provide a personalized touch. Every reply starts with this text: Namaste\n \nand ends with this text: \nBest regards\nYour name`;
		setStore({
			businessDetails,
			autoReplyType: "auto-reply",
			notifyScheduleTime: 15,
			notifyBadge: true,
			sidePanelOpenOn: true,
		});

		chrome.commands.getAll(async (commands) => {
			const missingShortcuts = [];
			for (const gks of commands) gks.shortcut === "" && missingShortcuts.push(gks);
			missingShortcuts.length === 0 || (await chrome.storage.local.set({ missingShortcuts }));
			chrome.tabs.create({ url: "/guide/welcome-guide.html" });
		});
	}
	reason === "install" && oneTimeInstall();
};

// installation setup
chrome.runtime.onInstalled.addListener(setInstallation);
