const CharCode = {
	Space: 32,
	LineBreak: 0xa, // "\n" 10
	Tab: 0x9, // "\t"
};

/** @param {string} data */
export function trimLeft(data) {
	const size = data.length;

	//trim left
	let startI = -1;
	while (++startI < size)
		if (data.charCodeAt(startI) !== CharCode.LineBreak && data.charCodeAt(startI) !== CharCode.Tab) break;
	return data.slice(startI);
}

/** @param {string[]} array*/
export function trimStartArray(array) {
	for (let index = 0; index < array.length; index++) if (array[index] !== "\n") return array.slice(index);
	return array;
}
