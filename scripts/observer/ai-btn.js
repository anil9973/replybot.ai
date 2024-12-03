import { Summarizer } from "../../AI/summarizer.js";

const cssStyleSheet2 = new CSSStyleSheet();
cssStyleSheet2.replace(`ai-summary-btn,
    ai-writer-btn {
        --color: rgb(195 91 255);
        color-scheme: light dark;
        font-size: 16px;
        color: var(--color);
        background-color: rgba(177, 74, 236, 0.3);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 2px 2px rgba(0, 0, 0, 0.24);

        & svg {
            fill: var(--color);
            vertical-align: middle;
            cursor: pointer;
        }
    }

    ai-summary-btn {
        display: flex;
        column-gap: 4px;
        align-items: center;
        padding: 4px 8px;
        border-radius: 10px;
        cursor: pointer;

        &.floating {
            position: fixed;
            bottom: 1em;
            right: 1em;
            z-index: 2200;
        }
    }

    ai-writer-btn {
        padding: 8px 5px;
        border-radius: 10px;
    }
`);
document.adoptedStyleSheets.push(cssStyleSheet2);

//Summary button
export function insertSummaryButton(parentElem, conversationMessages) {
	document.querySelector("ai-summary-btn")?.remove();
	const aiSummaryBtn = document.createElement("ai-summary-btn");
	aiSummaryBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 0 24 24">
			<path d="M7.75 9.25a1 1 0 1 0 0-2a1 1 0 0 0 0 2m3.5-1.75a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5zm0 3.75a.75.75 0 1 0 0 1.5h5.5a.75.75 0 1 0 0-1.5zm-.75 4.5a.75.75 0 0 1 .75-.75h5.5a.75.75 0 1 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75M8.75 12a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-1 4.75a1 1 0 1 0 0-2a1 1 0 0 0 0 2M6.25 3A3.25 3.25 0 0 0 3 6.25v11.5A3.25 3.25 0 0 0 6.25 21h11.5A3.25 3.25 0 0 0 21 17.75V6.25A3.25 3.25 0 0 0 17.75 3zM4.5 6.25c0-.966.784-1.75 1.75-1.75h11.5c.966 0 1.75.784 1.75 1.75v11.5a1.75 1.75 0 0 1-1.75 1.75H6.25a1.75 1.75 0 0 1-1.75-1.75z" />
		</svg>
		<span>Summary</span>`;
	aiSummaryBtn.addEventListener("click", showChatHistorySummary.bind(null, conversationMessages));
	parentElem?.firstElementChild.prepend(aiSummaryBtn);
}

async function showChatHistorySummary(conversationMessages, event) {
	const aiSummaryBtn = event.currentTarget;
	event.stopImmediatePropagation();

	const canSummarize = await Summarizer.checkAvailability();
	if (canSummarize === "Not available") return alert("Summary API not available");
	if (canSummarize === "after-download") alert("Summarizer downloading in progress");

	const { ChatSummarizerPopup } = await import(chrome.runtime.getURL("/scripts/summarizer/summarizer-popup.js"));
	/**@type {ChatSummarizerPopup} */
	const chatSummaryPopup = document.createElement("chat-summarizer-popup");
	const descriptors = Object.getOwnPropertyDescriptors(ChatSummarizerPopup.prototype);
	Object.defineProperties(chatSummaryPopup, descriptors);
	aiSummaryBtn.after(chatSummaryPopup);
	await chatSummaryPopup.connectedCallback();
	const rect = aiSummaryBtn.getBoundingClientRect();
	chatSummaryPopup.style.left = `min(${rect.left}px, ${screenX - 500}px)`;
	chatSummaryPopup.style.top = rect.top + 44 + "px";
	chatSummaryPopup.summarizeText(JSON.stringify(conversationMessages));
}

//AI writer button
export function insertAIWriterBtn(inputFieldElem) {
	document.querySelector("ai-writer-btn")?.remove();
	const aiWriteBtn = document.createElement("ai-writer-btn");
	aiWriteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 0 24 24">
		<path d="M21 11V9h-2V7a2.006 2.006 0 0 0-2-2h-2V3h-2v2h-2V3H9v2H7a2.006 2.006 0 0 0-2 2v2H3v2h2v2H3v2h2v2a2.006 2.006 0 0 0 2 2h2v2h2v-2h2v2h2v-2h2a2.006 2.006 0 0 0 2-2v-2h2v-2h-2v-2Zm-4 6H7V7h10Z" />
		<path d="M11.361 8h-1.345l-2.01 8h1.027l.464-1.875h2.316L12.265 16h1.062Zm-1.729 5.324L10.65 8.95h.046l.983 4.374ZM14.244 8h1v8h-1z" />
	</svg>`;
	inputFieldElem.parentElement.parentElement.before(aiWriteBtn);
	inputFieldElem.addEventListener("pointerup", showPopupAtSelection); //TODO not working
	aiWriteBtn.addEventListener("click", showWriterActionsPopup.bind(null, inputFieldElem));
}

async function showWriterActionsPopup(inputFieldElem, { currentTarget }) {
	const { MiraAiWriter } = await import(chrome.runtime.getURL("/scripts/writer/ai-writer.js"));
	const aiWriterPopup = document.createElement("mira-ai-writer");
	const descriptors = Object.getOwnPropertyDescriptors(MiraAiWriter.prototype);
	Object.defineProperties(aiWriterPopup, descriptors);
	currentTarget.after(aiWriterPopup);
	aiWriterPopup["connectedCallback"]();
	aiWriterPopup["inputFieldElem"] = inputFieldElem;
	const rect = currentTarget.getBoundingClientRect();
	aiWriterPopup.style.left = `min(${rect.left - aiWriterPopup.offsetWidth / 2}px,  ${screenX - 400}px)`;
	aiWriterPopup.style.top = rect.top - aiWriterPopup.offsetHeight - 20 + "px";
}

async function showEditFieldSelectActionPopup(posX, posY, range) {
	try {
		const popupUrl = chrome.runtime.getURL("/scripts/writer/selection-popup.js");
		const { EditFieldSelectionPopup } = await import(popupUrl);
		const editFieldSelectActionPopup = document.createElement("editfield-selection-popup");
		const descriptors = Object.getOwnPropertyDescriptors(EditFieldSelectionPopup.prototype);
		Object.defineProperties(editFieldSelectActionPopup, descriptors);
		document.body.appendChild(editFieldSelectActionPopup);
		editFieldSelectActionPopup["connectedCallback"]();
		editFieldSelectActionPopup.style.left = `min(80%, ${posX}px)`;
		editFieldSelectActionPopup.style.top = posY + "px";
		editFieldSelectActionPopup["range"] = range;
	} catch (error) {
		console.error(error);
	}
}

async function showPopupAtSelection() {
	const selection = getSelection();
	if (selection.isCollapsed) return;
	const range = selection.getRangeAt(0);
	const rect = range.getBoundingClientRect();
	const posY = rect.top - 25 + scrollY;
	const textData = selection.toString()?.trim();
	textData && showEditFieldSelectActionPopup(rect.left, posY, range.cloneRange());
}

export async function insertSuggestionListPopup(inputFieldElem) {
	const { WriterSuggestionList } = await import(chrome.runtime.getURL("/scripts/writer/writer-suggestion.js"));
	/**@type {WriterSuggestionList} */
	// @ts-ignore
	const suggestionListPopup = document.createElement("writer-suggestion-list");
	const descriptors = Object.getOwnPropertyDescriptors(WriterSuggestionList.prototype);
	Object.defineProperties(suggestionListPopup, descriptors);
	inputFieldElem.parentElement.before(suggestionListPopup);
	suggestionListPopup.connectedCallback();
	suggestionListPopup.inputFieldElem = inputFieldElem;
	const rect = inputFieldElem.getBoundingClientRect();
	suggestionListPopup.style.left = `min(${rect.left}px, 50%)`;
	suggestionListPopup.style.bottom = 90 + "px";
	return suggestionListPopup;
}
