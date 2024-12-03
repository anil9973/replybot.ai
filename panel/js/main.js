import "./reset.js";
import "../components/helper/atom-icon.js";
import "../components/helper/alert-box.js";
import "../components/top-bar.js";
import "../components/config/website-aibot-config.js";
// @ts-ignore
import baseCss from "../style/base.css" with { type: "css" };
import { getTabs } from "./constant.js";
document.adoptedStyleSheets.push(baseCss);

const mainElem = $("main");
const noOpenChatElem = eId("no_open_chat");

//Open chat context
async function openChatContext(conversationId) {
	const { ConversationContext } = await import("../components/chat/conversation-context.js");
	const chatContextElem = new ConversationContext();
	globalThis.conversationId = conversationId;
	noOpenChatElem.replaceWith(chatContextElem);
	chatContextElem.scrollIntoView();

	const topBar = $("top-bar");
	topBar.children[0].removeAttribute("active", "");
	topBar.children[1].setAttribute("active", "");
}

globalThis.waTabId = (await getTabs({ active: true, currentWindow: true }))[0]?.id;
globalThis.conversationId = await chrome.tabs.sendMessage(waTabId, "getConversionId").catch(() => {});
globalThis.conversationId && openChatContext(globalThis.conversationId);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.msg === "open_chat_context") {
		openChatContext(request.conversationId);
		sendResponse("opening..");
	} else if (request.msg === "close_chat_context") {
		mainElem.children[1].replaceWith(noOpenChatElem);
	}
});
