//Mail button
const mailButtons = eId("send-mail-buttons");
$on(mailButtons.lastElementChild, "click", createGMailLink);
$on(mailButtons.children[2], "click", createMailLink);
$on(mailButtons.children[1], "click", () => alert("Coming soon"));

function getExtensionInfo() {
	const { version, short_name } = chrome.runtime.getManifest();
	return `\n\nExtensionId: ${chrome.runtime.id}\nExtension Name: ${short_name}\nExtension Version: ${version}\nBrowser Info: ${navigator.userAgent}`;
}

function createMailLink() {
	const contactForm = $(".contact-form");
	let mailLink = "mailto:noterailhelp@gmail.com?";
	mailLink += `subject=${$("#subject", contactForm).value}`;
	mailLink += `&body=${$("#mailbody", contactForm).value}`;
	mailLink += getExtensionInfo();
	openMailLink(mailLink);
}

function createGMailLink() {
	const contactForm = $(".contact-form");
	let mailLink = "https://mail.google.com/mail/u/0/?to=noterailhelp@gmail.com";
	mailLink += `&su=${$("#subject", contactForm).value}`;
	mailLink += `&body=${$("#mailbody", contactForm).value}`;
	mailLink += getExtensionInfo();
	mailLink += "&tf=cm";
	openMailLink(mailLink);
}

function openMailLink(mailLink) {
	mailLink = encodeURI(mailLink);
	const a = document.createElement("a");
	a.href = mailLink;
	a.click();
}
