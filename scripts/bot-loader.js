console.log("bot-loader inserted");

async function onPageLoad() {
	await new Promise((r) => setTimeout(r, 3000));
	const appElem = document.getElementById("app");
	const sideDivElem = document.getElementById("side");
	if (sideDivElem) importBotScript();
	else {
		const observer = new MutationObserver(childElemAddListener);
		observer.observe(appElem, { childList: true, subtree: true });

		async function childElemAddListener(mutationList) {
			for (const mutation of mutationList) {
				if (mutation.addedNodes.length === 0) continue;
				const elem = mutation.addedNodes[0];
				if (elem.tagName === "DIV" && !elem.className) {
					importBotScript();
					observer.disconnect();
				}
			}
		}
	}

	async function importBotScript() {
		document.getElementById("side").parentElement.style.flex = "unset";
		try {
			await import(chrome.runtime.getURL("scripts/observer/whatsapp.js"));
		} catch (error) {
			console.error(error);
		}
	}
}

document.readyState !== "complete" ? addEventListener("load", onPageLoad) : onPageLoad();
