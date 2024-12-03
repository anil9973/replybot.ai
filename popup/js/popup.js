import "../../panel/js/reset.js";
import "../../panel/components/helper/atom-icon.js";
import "../../panel/components/helper/alert-box.js";
import "../components/unread-msg-container.js";
import { getTabs } from "../../panel/js/constant.js";
import { getCrtTab } from "../../panel/js/extractor.js";
// @ts-ignore
import baseCss from "../style/base.css" with { type: "css" };
import unreadMessageCss from "../style/unread-message.css" with { type: "css" };
document.adoptedStyleSheets.push(baseCss, unreadMessageCss);

setLang("open_whatsapp");

async function openWhatsappTab() {
	const tab = await getCrtTab();
	const url = "https://web.whatsapp.com/";
	const waTab = (await getTabs({ url }))[0];
	waTab
		? await chrome.tabs.update(waTab.id, { active: true })
		: await chrome.tabs.create({ url, index: tab.index + 1 });
	await chrome.sidePanel.open({ tabId: waTab.id });
	chrome.storage.session.set({ lastTabId: tab.id });
}
$on(eId("open_whatsapp"), "click", openWhatsappTab);
