export const getCrtTab = async () => (await chrome.tabs.query({ currentWindow: true, active: true }))[0];

export async function extractPageContent(tabId) {
	try {
		return await injectFuncScript(getMarkdownContent, tabId);
	} catch (error) {
		console.error(error);
		notify("Failed to extract article", "error");
		//setTimeout(() => document.body.appendChild(new ReportBug(error)), 2000);
	}
}

/**@param {(...args: any[]) => any} func*/
export async function injectFuncScript(func, tabId, ...args) {
	const results = await chrome.scripting.executeScript({
		target: { tabId },
		func: func,
		args: args,
	});
	return results?.[0]?.result;
}

function getMarkdownContent() {
	const host = location.host;
	const index = host.indexOf(".");
	const domain = host.lastIndexOf(".") === index ? host : host.slice(index + 1);

	return new Promise(async (resolve, reject) => {
		let rootArticleElem;

		function getArticleRoot() {
			// biome-ignore format:
			const IgnoreTags = new Set(["IMG","FIGURE","PICTURE", "svg", "CANVAS", "VIDEO", "STYLE", "HEADER", "NAV", "SCRIPT","ASIDE","BLOCKQUOTE","P","FOOTER","H1","H2","H3","UL","OL","FORM", "LI","A","TEXTAREA","INPUT","DL","DD","TABLE"]);
			const minWidth = innerWidth * 0.5;
			const elementStack = [];

			/** @param {HTMLElement} parentElem*/
			function traverse(parentElem) {
				function filterElem(elem) {
					if (IgnoreTags.has(elem.tagName)) return false;
					if (elem.childElementCount === 0) return false;
					//if (elem.computedStyleMap().get("position").value !== "static") return false;
					return true;
				}
				const childElements = Array.prototype.filter.call(parentElem.children, filterElem);
				const heights = Array.prototype.map.call(childElements, (elem) => elem.offsetHeight);

				const maxHeight = Math.max(...heights);
				const index = heights.indexOf(maxHeight);
				const element = childElements[index];
				if (!element) return;
				if (element.offsetWidth < minWidth) return;
				if (element.offsetHeight < elementStack.at(-1)?.offsetHeight * 0.5) return;
				elementStack.push(element);
				traverse(element);
			}

			traverse(document.body);
			return elementStack.at(-1);
		}

		const selection = getSelection();
		if (!selection.isCollapsed) {
			rootArticleElem = selection.getRangeAt(0).cloneContents();
			rootArticleElem.children.length === 0 && (rootArticleElem = getArticleRoot());
		} else rootArticleElem = getArticleRoot();

		try {
			const generateUrl = chrome.runtime.getURL("/scripts/markdown/serializer/mark-txt-serializer.js");
			const { MarkTextSerializer } = await import(generateUrl);
			const markdownSerializer = new MarkTextSerializer();
			const mdContent = markdownSerializer.serialize(rootArticleElem.children);
			resolve(mdContent);
		} catch (error) {
			console.error(error);
			chrome.runtime.sendMessage({ error });
			reject(error);
		}
	});
}
