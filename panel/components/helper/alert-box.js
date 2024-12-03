const cssStyleSheet = new CSSStyleSheet();
cssStyleSheet.replace(`:host {
	height: 2em;
	border-radius: 6px;
	font-size: clamp(0.8rem, 1vw + 0.7rem, 1rem);
}

:host(#alert-box) {
	padding: 0;
	translate: 110% 0;
	transition: translate 600ms ease-out;
}

div {
	height: 100%;
	padding-left: 0.4em;
	color: white;
	display: flex;
	align-items: center;
	border-radius: 4px;

	& .notice-txt {
		text-wrap: nowrap;
		overflow: hidden;
		flex-grow: 1;
		margin-left: 0.5em;

		& + svg {
			align-self: start;
			inline-size: 1.1em;
		}
	}

	&.success {
		background-color: limegreen;
	}

	&.error {
		background-color: #ff2800;

		& > svg:first-child path {
			d: path(
				"M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2C6.47,2 2,6.47 2,12C2,17.53 6.47,22 12,22C17.53,22 22,17.53 22,12C22,6.47 17.53,2 12,2M14.59,8L12,10.59L9.41,8L8,9.41L10.59,12L8,14.59L9.41,16L12,13.41L14.59,16L16,14.59L13.41,12L16,9.41L14.59,8Z"
			);
		}
	}
}`);

class AlertBox extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [cssStyleSheet];
	}

	show = (noticeTxt, type = "success") => {
		this.box.className = type;
		this.box.children[1].textContent = noticeTxt;
		this.showPopover();
		setTimeout(() => this.hidePopover(), 4100);
	};

	render() {
		return `<div>
				<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d='M10,17L5,12L6.41,10.58L10,14.17L17.59,6.58L19,8M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z' /></svg>
				<span class="notice-txt"></span>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>
			</div>`;
	}

	connectedCallback() {
		this.id = "alert-box";
		this.setAttribute("popover", "");
		this.shadowRoot.innerHTML = this.render();
		this.box = this.shadowRoot.firstElementChild;
		this.box.lastElementChild.addEventListener("click", () => this.hidePopover());
	}
}

customElements.define("alert-box", AlertBox);
const alertBox = new AlertBox();
document.body.appendChild(alertBox);
globalThis.notify = alertBox.show;
