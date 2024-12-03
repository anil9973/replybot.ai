//Embed API_KEY -> billing not enabled
const API_KEY = "AIzaSyC3YzXGfVk-29PFS3Aa2hjOivMkX54uuuM";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
const headers = new Headers({ "Content-Type": "application/json" });

export async function generateContentOnGeminiServer(promptMessage, imageBase64) {
	const payload = {
		contents: [
			{
				parts: [{ text: promptMessage }],
			},
		],
	};
	if (imageBase64) {
		const image = {
			inlineData: {
				data: imageBase64,
				mimeType: "image/png",
			},
		};
		// @ts-ignore
		payload.contents[0].parts.push(image);
	}

	try {
		const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
		const jsonData = await response.json();
		if (response.ok) {
			return jsonData.candidates[0].content.parts.map((part) => part.text).join("");
		} else console.log(jsonData);
	} catch (error) {
		console.error(error);
	}
}
