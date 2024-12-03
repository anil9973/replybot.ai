export const rdmId = () => Math.random().toString(36).slice(2);

export function timeAgo(input) {
	const date = input instanceof Date ? input : new Date(input);
	const formatter = new Intl.RelativeTimeFormat("en");
	const ranges = {
		years: 3600 * 24 * 365,
		months: 3600 * 24 * 30,
		weeks: 3600 * 24 * 7,
		days: 3600 * 24,
		hours: 3600,
		minutes: 60,
		seconds: 1,
	};
	const secondsElapsed = (date.getTime() - Date.now()) / 1000;
	for (let key in ranges) {
		if (ranges[key] < Math.abs(secondsElapsed)) {
			const delta = secondsElapsed / ranges[key];
			// @ts-ignore
			return formatter.format(Math.round(delta), key);
		}
	}
}

export function extractDynamicKeys(linkUrl, obj) {
	obj.ask_agent = obj.ask_customer = [];
	const keyRx = new RegExp(/\[\[(.*)\]\]/g);
	const matches = linkUrl.matchAll(keyRx);
	matches?.forEach((match) => {
		const [dynamic_key, askTo] = match[1].split(",", 2);
		obj[askTo.trim()]?.push(dynamic_key.trim());
	});
	return obj;
}
