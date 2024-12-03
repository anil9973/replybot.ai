import { insertSummaryButton, insertAIWriterBtn, insertSuggestionListPopup } from "./ai-btn.js";
import { Translator } from "../../AI/translator.js";
import { AiWriter } from "../../AI/writer.js";
import { extractJSONContent } from "../../AI/parser.js";

console.log("Whatsapp script injected");
globalThis.$ = (selector, scope) => (scope || document).querySelector(selector);
globalThis.i18n = chrome.i18n.getMessage.bind(this);
globalThis.getStore = chrome.storage.local.get.bind(chrome.storage.local);
globalThis.setStore = chrome.storage.local.set.bind(chrome.storage.local);
let agentName = "Ruby";
getStore("agentname").then(({ agentname }) => agentname && (agentName = agentname));

class ChatMessage {
	constructor(senderType, senderName, contentBody, date) {
		this.senderType = senderType; //Agent or Customer
		this.senderName = senderName ?? senderType;
		this.contentBody = contentBody;
		this.date = date;
	}
}

var openConversationObserver;
document.getElementById("main") &&
	queueMicrotask(() => (openConversationObserver = new OpenConversationObserver()));
//Observe Open conversation
const openConversationWrapper = $("header").nextElementSibling.nextElementSibling;
const observer = new MutationObserver(opnConversationListener);
observer.observe(openConversationWrapper, { childList: true });
function opnConversationListener(mutationList) {
	for (const mutation of mutationList) {
		if (mutation.addedNodes.length === 0) continue;
		openConversationObserver?.destroy();
		mutation.addedNodes[0].id === "main" && (openConversationObserver = new OpenConversationObserver());
	}
}

class OpenConversationObserver {
	constructor() {
		this.init();
	}

	/** @type {ChatMessage[]}*/
	conversationMessages = [];

	async init() {
		const keys = ["autoReplyType", "businessDetails","sidePanelOpenOn"]
		const { autoReplyType, businessDetails, sidePanelOpenOn } = await getStore(keys);
		const context = businessDetails ? businessDetails : "Act as a customer support agent of XYZ company";
		this.aiWriter = new AiWriter();
		this.aiTranslator = new Translator();
		this.replyContext = "";
		await this.aiWriter.createWriter(context);
		await this.aiTranslator.createLangDetector();

		const chatheaderElem = $("header", document.getElementById("main"));
		this.customerName = $("span[dir]", chatheaderElem).textContent;
		this.replyType = autoReplyType ?? "auto-reply";
		this.messagesContainer = $('[role="application"]');
		const conversationId = $("[data-id]", this.messagesContainer)?.getAttribute("data-id");
		this.conversationId = conversationId?.slice(conversationId.indexOf("_") + 1) ?? this.customerName;
		this.footerElem = $("footer");
		this.messageInputElem = $('[contenteditable="true"]', this.footerElem);
		this.messageInputElem.addEventListener("keyup", (event) => {
			event.ctrlKey && event.code === "Space" && this.suggestFiveGeneratedReplies();
		});

		//Insert Summary and AI button
		insertSummaryButton(chatheaderElem?.lastElementChild, this.conversationMessages);
		insertAIWriterBtn(this.messageInputElem);
		this.suggestionListPopup = await insertSuggestionListPopup(this.messageInputElem);

		//ExtractExisting message to JSON format and translate If foreign lang detect
		this.messagesContainer && this.actionOnChatMessages(this.messagesContainer);

		//Observe new Message in open conversation
		this.observeNewMessage();

		//Delete unread messages from db
		chrome.runtime.sendMessage({ msg: "deleteUnreadMessage", profileName: this.customerName });
		//Open context panel
		sidePanelOpenOn && chrome.runtime.sendMessage({ msg: "openSP_chatContext", conversationId: this.conversationId });
	}

	observeNewMessage() {
		this.msgObserver = new MutationObserver(opnConversationListener.bind(this));
		this.msgObserver.observe(this.messagesContainer, { childList: true, subtree: true });
		function opnConversationListener(mutationList) {
			for (const mutation of mutationList) {
				if (mutation.addedNodes.length === 0) continue;
				const divElem = mutation.addedNodes[0];
				if (divElem.role === "row") {
					const messageElem = $(".message-in", divElem) ?? $(".message-out", divElem);
					if (!messageElem) continue;
					this.addMessage(messageElem);
					if (messageElem.classList.contains("message-in")) {
						setTimeout(() => divElem.nextElementSibling || this.generateReply($("[dir]", messageElem)), 0);
					}
				}
			}
		}
	}

	actionOnChatMessages(messagesContainer) {
		const conversationMessages = messagesContainer.querySelectorAll(".message-in");
		for (const messageElem of conversationMessages) this.addMessage(messageElem);
		for (const messageElem of messagesContainer.querySelectorAll(".message-out")) this.addMessage(messageElem);

		//If Last message from customer generate reply
		const lastMessageElem = $(".message-in", messagesContainer.lastElementChild);
		if (lastMessageElem) {
			const messageTextBox = $("[dir]", lastMessageElem);
			messageTextBox && this.generateReply(messageTextBox);
		}
	}

	/** @param {HTMLElement} messageElem*/
	addMessage(messageElem) {
		const senderType = messageElem.classList.contains("message-in")
			? "customer"
			: messageElem.classList.contains("message-out") && "agent";
		const messageTextBox = $("[dir]", messageElem);
		if (!senderType || !messageTextBox) return;
		const timeTxt = $("[data-pre-plain-text]", messageElem)?.getAttribute("data-pre-plain-text");
		const time = timeTxt?.slice(1, timeTxt.indexOf("]"));
		const senderName = senderType === "customer" ? this.customerName : agentName;
		const chatMessage = new ChatMessage(senderType, senderName, messageTextBox.textContent, time);
		this.conversationMessages.push(chatMessage);
		if (senderType === "customer") this.translateMessage(messageTextBox);
	}

	async translateMessage(messageElem) {
		const sourceText = messageElem?.textContent;
		const translatedText = await this.aiTranslator.translate(sourceText);
		if (!translatedText) return;
		const p = document.createElement("p");
		p.appendChild(new Text("translated:" + translatedText));
		messageElem.appendChild(p);
	}

	async generateReply(messageElem) {
		try {
			await this.aiWriter.stop();
			const customerQuery = messageElem?.textContent;
			//Detect customer language and reply in their language
			// const queryLang = await this.aiTranslator.detectLang(customerQuery); //Writer API only work in english

			//When customer reply of ask question
			askCustomerCb && askCustomerCb(customerQuery), (askCustomerCb = null);

			getSelection().setPosition(this.messageInputElem.firstElementChild, 0);
			if (this.replyType === "suggest-reply") return this.suggestFiveGeneratedReplies();
			await this.aiWriter.writeTextStream(customerQuery, this.replyContext);

			if (this.replyType === "auto-reply") {
				await new Promise((r) => setTimeout(r, 2000));
				const sendMessageButton = Array.prototype.at.call(this.footerElem.querySelectorAll("button"), -1);
				requestIdleCallback(() => sendMessageButton.click());
			}
		} catch (error) {
			console.error(error);
			toast(error.message);
		}
	}

	async suggestFiveGeneratedReplies() {
		const lastCustomerMessage = this.conversationMessages.findLast((msg) => msg.senderType == "customer");
		if (!lastCustomerMessage || !lastCustomerMessage.contentBody) return;
		const promptMsg = `A customer has asked the following question: '${lastCustomerMessage}'. I need to send a single reply, but I would like up to 5 different options to choose from. Please provide these options in JSON format. Each option should vary in tone, including positive, neutral, apologetic, and negative. Ensure that the responses are appropriate to the question and reflect the specified tones.`;
		const context = "";
		try {
			const response = await this.aiWriter.write(promptMsg, context);
			const suggestionList = extractJSONContent(response);
			this.suggestionListPopup.showSuggestionList(suggestionList);
		} catch (error) {
			console.error(error);
			toast(error.message);
		}
	}

	sendMessageByBot(message) {
		getSelection().setPosition(this.messageInputElem, 0);
		document.execCommand("insertText", null, message);
		const sendMessageButton = Array.prototype.at.call(this.footerElem.querySelectorAll("button"), -1);
		sendMessageButton.click();
	}

	async detectCustomerLang() {
		try {
			const lastCustomerMessage = this.conversationMessages.findLast((msg) => msg.senderType == "customer");
			return await this.aiTranslator.detectLang(lastCustomerMessage.contentBody);
		} catch (error) {
			console.error(error);
		}
	}

	destroy() {
		this.msgObserver?.disconnect();
		this.aiWriter.destroy();
		$("ai-summary-btn")?.remove();
		$("ai-writer-btn")?.remove();
		askCustomerCb = null;
	}
}

//=== Conversation list message listener ===

let notifyScheduleType, notifyScheduleTime, notifyBadge, timerId, aiTranslator, askCustomerCb;
getStore(["notifyScheduleType", "notifyScheduleTime", "notifyBadge"]).then((obj) => {
	notifyScheduleType = obj.notifyScheduleType;
	notifyScheduleTime = obj.notifyScheduleTime * 60 * 1000;
});

const waConversationList = $('#pane-side div[role="grid"]');
const waObserver = new MutationObserver(txtChangeListener);
waObserver.observe(waConversationList, { characterData: true, childList: true, subtree: true });

async function txtChangeListener(mutationList) {
	if (mutationList[0].type === "characterData") {
		const conversationItem = mutationList[0].target.parentElement.closest('div[role="listitem"]');
		const textElems = conversationItem.querySelectorAll("[dir]");
		const messageTextElem = Array.prototype.at.call(textElems, -1);

		aiTranslator ??= new Translator();
		const msgText = messageTextElem.textContent;
		const msgTextContent = await aiTranslator.translate(msgText);
		msgTextContent && (messageTextElem.textContent = msgTextContent);
		// conversationItem?.click(); //CAVEAT Don't work  user need to click manually

		//If tab is not active, then save in db/notify unread message
		tabActive || notifyUnreadMessage(conversationItem, textElems, msgTextContent ?? msgText);
	}
}

async function notifyUnreadMessage(conversationItem, textElems, msgTextContent) {
	if (notifyScheduleType === "msg-open-tab") return chrome.runtime.sendMessage("openWhatsappTab");
	const profileName = textElems[0].textContent;
	const time = textElems[0].parentElement.parentElement.nextElementSibling.textContent;
	const unreadMessage = { profileName, textContent: msgTextContent, time };
	await chrome.runtime.sendMessage({ msg: "saveUnreadMessage", unreadMessage });
	const chatProfilePics = (await getStore("chatProfilePics")).chatProfilePics ?? {};
	chatProfilePics[profileName] = $("img", conversationItem).src;
	await setStore({ chatProfilePics });
	if (notifyScheduleType === "msg-open-popup") return chrome.runtime.sendMessage("openPopup");
	if (notifyBadge) chrome.runtime.sendMessage("plusMsgCountBadge");
	if (timerId) return;
	if (notifyScheduleType === "time-open-tab")
		timerId = setTimeout(() => chrome.runtime.sendMessage("openWhatsappTab").then(clearTimer), notifyScheduleTime);
	else if (notifyScheduleType === "time-open-popup")
		timerId = setTimeout(() => chrome.runtime.sendMessage("openPopup").then(clearTimer), notifyScheduleTime);
}

const clearTimer = () => timerId && (clearTimeout(timerId), (timerId = null));

var tabActive = true;
addEventListener("visibilitychange", () => {
	tabActive = document.visibilityState === "visible";
	clearTimer();
});

//Chrome message exchange
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request === "getConversionId") sendResponse(openConversationObserver.conversationId);
	else if (request === "getOpenChatProfile") {
		const headerElem = $("header", document.getElementById("main"));
		sendResponse($("span[dir]", headerElem).textContent);
	} else if (request === "getGeneratedReply") sendResponse(openConversationObserver.messageInputElem.textContent);
	else if (request.command === "sendOpenChatReply") {
		const sendMessageButton = Array.prototype.at.call($("footer").querySelectorAll("button"), -1);
		sendMessageButton?.click();
	} else if (request.command === "ask_customer_dynamic_value") {
		if (!openConversationObserver) return toast("No chat opened");
		const message = `Could you provide your ${request.dynamicKeys.join(",")} so we can assist you further?`;
		openConversationObserver.sendMessageByBot(message);
		askCustomerCb = sendResponse;
		return true;
		//TODO wait for customer reply then send dynamic_value to chat context
	} else if (request.command === "send_message_to_open_chat") {
		if (!openConversationObserver) return toast("No chat opened");
		openConversationObserver.sendMessageByBot(request.replyMessage);
	} else if (request.command === "add_open_chat_context_data") {
		if (!openConversationObserver) return toast("No chat opened");
		openConversationObserver.replyContext += request.contextData;
	} else if (request.command === "updateNotifySchedule") {
		request.notifyScheduleType && (notifyScheduleType = request.notifyScheduleType);
		request.notifyScheduleTime && (notifyScheduleTime = request.notifyScheduleTime);
		request.notifyBadge && (notifyBadge = request.notifyBadge);
	}
});

//Error toast
const toastElem = document.createElement("output");
toastElem.id = "error-notifier";
toastElem.hidden = true;
document.body.appendChild(toastElem);
globalThis.toast = (msg) => {
	toastElem.hidden = false;
	toastElem.innerText = msg;
	setTimeout(() => (toastElem.hidden = true), 5100);
};

const cssStyleSheet = new CSSStyleSheet();
cssStyleSheet.insertRule(`#error-notifier {
	min-width: 8em;
	background-color: red;
	color: white;
	font-size: 16px;
	font-weight: bold;
	text-align: center;
	border-radius: 12px;
	padding: 4px 8px;
	position: fixed;
	z-index: 1000;
	margin-inline: auto;
	inset-inline: 0;
	top: 20px;
	width: max-content;
	translate: 0 -200%;
	animation: in-out 5s ease-out;
}`);

cssStyleSheet.insertRule(`@keyframes in-out { 10%, 90% { translate: 0 0; } }`);
document.adoptedStyleSheets.push(cssStyleSheet);
