import { html } from "../../js/om.event.js";

export class ScheduleNotify extends HTMLDetailsElement {
	constructor() {
		super();
	}

	onChange({ target }) {
		const message = { command: "updateNotifySchedule" };
		if (target.name === "notify-schedule") {
			const notifyScheduleType = target.value;
			setStore({ notifyScheduleType });
			message.notifyScheduleType = notifyScheduleType;
		} else if (target.name === "time") {
			const notifyScheduleTime = +target.value;
			setStore({ notifyScheduleTime });
			message.notifyScheduleTime = notifyScheduleTime;
		} else if (target.name === "notify-badge") {
			const notifyBadge = target.checked;
			setStore({ notifyBadge });
			message.notifyBadge = notifyBadge;
		}
		chrome.tabs.sendMessage(waTabId, message);
	}

	render() {
		return html`<summary> <atom-icon ico="bell-ring" title=""></atom-icon> <span>${i18n("notify_schedule")}</span></summary>
        <ul>
            <li><label> <input type="radio" name="notify-schedule" value="msg-open-tab"> <span>${i18n("switch_tab_when_new_message_received")}</span> </label> </li>
            <li>
                <label> <input type="radio" name="notify-schedule" value="time-open-tab"> <span>${i18n("switch_tab_time_schedule")} </span> </label>
                <select name="time">
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="60">1 Hr</option>
                    <option value="120">2 Hr</option>
                    <option value="180">3 Hr</option>
                </select> 
            </li>
            <li><label> <input type="radio" name="notify-schedule" value="msg-open-popup"> <span>${i18n("open_popup_when_new_message_received")}</span> </label> </li>
            <li>
            <label> <input type="radio" name="notify-schedule" value="time-open-popup"> <span>${i18n("open_popup_time_schedule")}</span> </label>
                <select name="time">
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="60">1 Hr</option>
                    <option value="120">2 Hr</option>
                    <option value="180">3 Hr</option>
                </select> 
            </li>
             <li><label> <input type="checkbox" name="notify-badge" value="msg-notify-schedule" checked> <span>${i18n("unread_messages_count_badge")}</span> </label> </li>
        </ul>`;
	}

	async connectedCallback() {
		const key = ["notifyScheduleType", "notifyScheduleTime", "notifyBadge"];
		const { notifyScheduleType, notifyScheduleTime, notifyBadge } = await getStore(key);
		const radioElem = $(`input[value="${notifyScheduleType}"]`);
		radioElem && (radioElem.checked = true);
		this.replaceChildren(this.render());
		this.open = true;
		$on(this, "change", this.onChange.bind(this));
	}
}

customElements.define("notify-schedule", ScheduleNotify, { extends: "details" });
