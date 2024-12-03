import { State, TwinMarkers, CharCode, TableDividers, Sequences, Markers } from "./enums.js";
import { EventEmitter } from "../EventEmitter.js";

export class Tokenizer extends EventEmitter {
	inlineCode = 0;
	index = 1;
	sectionStart = 0;
	state = State.BeforeNewLine;

	constructor() {
		super();
	}

	skipUptoSequence(sequence) {
		const seqLength = sequence.length;
		const _sequence = [];

		while (++this.index < this.size) {
			const _count = _sequence.length;
			if (seqLength === _count) break;

			const code = this.buffer[this.index];
			sequence[_count] === code ? _sequence.push(code) : (_sequence.length = 0);
		}
	}

	skipUntilMarker() {
		while (TwinMarkers.has(this.buffer[++this.index])) {
			if (this.index === this.size || this.buffer[this.index] === CharCode.LineBreak) break;
		}
	}

	skipWhitespace() {
		while (this.buffer[++this.index] == CharCode.Space)
			if (this.index === this.size || this.buffer[this.index] === CharCode.LineBreak) break;
		return this.buffer[this.index];
	}

	fastForwardTo(char) {
		if (this.buffer[this.index] === char) return true;
		while (this.buffer[++this.index] !== char)
			if (this.index === this.size || this.buffer[this.index] === CharCode.LineBreak) return;
		return true;
	}

	sendSpanText() {
		const data = this.buffer.slice(this.sectionStart, this.index);
		data && this.emit("spantext", data);
		this.sectionStart = this.index;
	}

	sendTextData() {
		const data = this.buffer.slice(this.sectionStart, this.index);
		data && this.emit("text", data);
		this.sectionStart = this.index;
	}

	stateInTableBody() {
		this.emit("addtablerow");
		this.sectionStart = ++this.index; //+ for skip |
		while (this.buffer[++this.index] !== CharCode.LineBreak) {
			const char = this.buffer[this.index];
			if (char === CharCode.Pipe) {
				const text = this.buffer.slice(this.sectionStart + 1, this.index); //+ for skip |
				this.emit("addtablecell", text);
				this.sectionStart = this.index;
			}
			if (!char) break; //temp
		}
		this.sectionStart = this.index;
		this.buffer[this.index + 1] === CharCode.Pipe ? this.stateInTableBody() : --this.index; //-1 for main while loop
	}

	verifyTableSyntax(char) {
		console.log("Table syntax is verifying");
		let crtIndex = this.index;
		const tableHeads = [{ start: crtIndex + 1 }]; //don't include pipe
		//head _count
		let headCount = 1;
		while (this.buffer[++crtIndex] !== CharCode.LineBreak) {
			char = this.buffer[crtIndex];
			if (char === CharCode.Pipe) {
				tableHeads[headCount - 1].end = crtIndex;
				headCount++;
				tableHeads.push({ start: crtIndex + 1 }); //don't include pipe
			}
		}
		tableHeads[headCount - 1].end ??= crtIndex; //end pipe are not mandatory
		++crtIndex; //go to next line

		// check next line and count --
		char = this.buffer[crtIndex];
		if (char === CharCode.Pipe) {
			headCount--;
			while (this.buffer[++crtIndex] !== CharCode.LineBreak) {
				char = this.buffer[crtIndex];
				if (TableDividers.has(char)) {
					if (char === CharCode.Pipe) headCount--;
				}
			}

			if (headCount === 0) {
				const tHeadCells = tableHeads.map((data) => this.buffer.slice(data.start, data.end));
				this.emit("table", tHeadCells);
				this.sectionStart = this.index = ++crtIndex; //+1 for skip newline
				this.buffer[this.index] === CharCode.Pipe && this.stateInTableBody();
			}
			++this.index; //skip |
		}
	}

	stateInHashTag() {
		this.fastForwardTo(CharCode.Space);
		const text = this.buffer.slice(this.sectionStart, this.index);
		this.sectionStart = this.index;
		this.emit("hashTag", text);
	}

	stateBeforeHeading() {
		this.state = State.BeforeHeading;
		const stringEnd = this.fastForwardTo(CharCode.Space);
		if (!stringEnd) return (this.marker = this.buffer.slice(this.sectionStart, this.index));
		const marker = this.buffer.slice(this.sectionStart, this.index + 1); //+1 include space
		this.emit("startmarker", (this.marker ?? "") + marker);
		this.marker = "";
		this.state = null;
		this.sectionStart = this.index;
	}

	stateBeforeHashTag(char) {
		char === CharCode.Hash || char === CharCode.Space ? this.stateBeforeHeading() : this.stateInHashTag();
	}

	stateBeforeUnorderedList(char) {
		this.state = State.BeforeUnorderedList;
		if (!char) return;
		if (char === CharCode.Space) {
			if (this.buffer[++this.index] === CharCode.OpeningSqrBracket) {
				const checked = this.buffer[++this.index] === "x";
				if (this.buffer[++this.index] !== CharCode.ClosingSqrBracket) return;
				if (this.buffer[++this.index] !== CharCode.Space) return;
				++this.index; //+1 include space
			}
			const mark = this.buffer.slice(this.sectionStart, this.index);
			this.emit("startmarker", mark === " " ? "- " : mark); //temp
			this.sectionStart = this.index;
			this.state = null;
		} else if (char === CharCode.Dash && this.buffer[++this.index] === CharCode.Dash) {
			if (this.buffer[this.index + 1] !== CharCode.LineBreak) return;
			this.emit("startmarker", this.buffer.slice(this.sectionStart, ++this.index));
		}
	}

	stateBeforeOrderedList(char) {
		this.state = State.BeforeOrderedList;
		if (!char) return;
		if (char === CharCode.Dot) char = this.buffer[++this.index];
		if (char === CharCode.Space) {
			const mark = this.buffer.slice(this.sectionStart, this.index);
			this.emit("startmarker", +mark[0] ? mark : `${this.listCounter}. `);
			this.state = null;
			this.sectionStart = this.index;
		}
	}

	stateInFenceBlock() {
		this.skipUptoSequence(Sequences.Fence);
		const preContent = this.buffer.slice(this.sectionStart, this.index);
		const isEnd = preContent.endsWith(Sequences.Fence);
		this.emit("fenceblock", isEnd ? preContent.slice(0, -3) : preContent, isEnd);
		isEnd && ((this.state = null), (this.sectionStart = this.index));
	}

	stateBeforeFenceBlock() {
		this.state = State.BeforeFenceBlock;
		if (!this.buffer[this.index + 1]) return;
		if (this.buffer[++this.index] === CharCode.BackTick && this.buffer[++this.index] === CharCode.BackTick) {
			this.state = State.InFenceBlock;
			this.sectionStart = this.index + 2; //skip `\n
			this.stateInFenceBlock();
		}
	}

	stateInMathBlock() {
		this.skipUptoSequence(Sequences.Math);
		const preContent = this.buffer.slice(this.sectionStart, this.index);
		const isEnd = preContent.endsWith(Sequences.Math);
		this.emit("mathblock", isEnd ? preContent.slice(0, -3) : preContent, isEnd);
		isEnd && ((this.state = null), (this.sectionStart = this.index));
	}

	stateBeforeMathBlock() {
		this.state = State.BeforeMathBlock;
		if (!this.buffer[this.index + 1]) return;
		if (this.buffer[++this.index] === CharCode.Dollar && this.buffer[++this.index] === CharCode.LineBreak) {
			this.state = State.InMathBlock;
			this.sectionStart = ++this.index;
			this.stateInMathBlock();
		}
	}

	stateInFootnote() {
		this.state = State.InFootnote;
		if (!this.buffer[this.index + 1]) return;
		this.fastForwardTo(CharCode.ClosingSqrBracket);
		if (this.buffer[++this.index] === CharCode.Colon) {
			const linkId = this.buffer.slice(this.sectionStart + 2, this.index - 1);
			this.emit("startmarker", `[^${linkId}]: `);
			this.sectionStart = ++this.index;
		}
	}

	blockMarkers = {
		[CharCode.Hash]: () => this.stateBeforeHashTag(this.buffer[++this.index]),
		[CharCode.BlockQuote]: () => (this.emit("startmarker", ">"), ++this.index),
		[CharCode.Dash]: () => this.stateBeforeUnorderedList(this.buffer[++this.index]),
		[CharCode.Plus]: () => this.stateBeforeUnorderedList(this.buffer[++this.index]),
		[CharCode.Bullet]: () => this.stateBeforeUnorderedList(this.buffer[++this.index]),
		// biome-ignore format:
		[CharCode.Asterisk]: () => this.buffer[this.index+1] === CharCode.Asterisk ? this.stateInlineMarker(): this.stateBeforeUnorderedList(this.buffer[++this.index]),
		[CharCode.Pipe]: () => this.verifyTableSyntax(this.buffer[this.index]),
		[CharCode.LineBreak]: () => this.buffer[++this.index] && this.stateBeforeNewLine(this.buffer[this.index]),
		[CharCode.OpeningAngleBracket]: () => this.stateInHtml(true),
		[CharCode.BackTick]: () => this.stateBeforeFenceBlock(),
		[CharCode.Dollar]: () => this.stateBeforeMathBlock(),
		[CharCode.Tab]: () => (this.emit("indent"), this.stateBeforeNewLine(this.buffer[++this.index])),
		[CharCode.Colon]: () => this.buffer[++this.index] === CharCode.Space && this.emit("startmarker", ": "),
		// biome-ignore format:
		[CharCode.OpeningSqrBracket]: () => this.buffer[++this.index] === CharCode.Circumflex ? this.stateInFootnote() : this.buffer[this.index] === CharCode.OpeningSqrBracket ? this.stateInWikiLink() : this.stateBeforeLinkUrl(),
	};

	stateBeforeNewLine(char) {
		this.state = null;
		this.sectionStart = this.index;
		if (char === CharCode.Space) {
			char === CharCode.Space && (char = this.skipWhitespace());
			const spaceCount = this.index - this.sectionStart;
			if (spaceCount >= 3) {
				for (let index = 0; index < Math.floor(spaceCount / 3); index++) this.emit("indent");
			}
			this.buffer[this.index + 1] ?? (this.state = State.BeforeNewLine);
			this.sectionStart = this.index;
		}

		if (this.blockMarkers[char]) {
			this.blockMarkers[char]();
			this.sectionStart = this.index;
		} else if (this.markers[char]) {
			this.markers[char]();
			this.sectionStart = this.index;
		} else if (+char) {
			if (this.buffer[++this.index] && this.buffer[this.index] !== CharCode.Dot) return;
			this.listCounter = +char;
			this.stateBeforeOrderedList(this.buffer[++this.index]);
		}
	}

	markers = {
		[CharCode.LineBreak]: () => {
			this.sendTextData();
			this.emit("newline");
			this.buffer[++this.index] === CharCode.LineBreak && (this.emit("newline"), ++this.index);
			const char = this.buffer[this.index];
			char ? this.stateBeforeNewLine(char) : (this.state = State.BeforeNewLine);
		},
		[CharCode.Hash]: () => {
			if (this.buffer[this.index + 1] === CharCode.Space) return;
			this.sendTextData();
			this.stateInHashTag();
		},
		[CharCode.OpeningAngleBracket]: () => (this.sendTextData(), this.stateInHtml()),
		[CharCode.ExclamationMark]: () => {
			if (this.buffer[this.index + 1] !== CharCode.OpeningSqrBracket) return;
			this.sendTextData();
			this.index = this.index + 2;
			this.stateBeforeEmbedLink();
		},
		[CharCode.OpeningSqrBracket]: () => {
			this.sendTextData();
			// biome-ignore format:
			this.buffer[this.index + 1] === CharCode.Circumflex ? this.stateInFootNoteRef() : this.buffer[this.index + 1] === CharCode.OpeningSqrBracket ? this.stateInWikiLink() : this.stateBeforeLinkUrl();
		},
		[CharCode.Percent]: () => {
			if (this.buffer[this.index + 1] !== CharCode.Percent) return;
			this.sendTextData();
			this.stateInObsidianComment();
		},
		[CharCode.BackSlash]: () => (this.sendTextData(), (this.sectionStart = ++this.index)),
	};

	cursorStates = {
		[State.BeforeUnorderedList]: this.stateBeforeUnorderedList.bind(this),
		[State.BeforeNewLine]: this.stateBeforeNewLine.bind(this),
		[State.BeforeHeading]: this.stateBeforeHeading.bind(this),
		[State.BeforeOrderedList]: this.stateBeforeOrderedList.bind(this),
		[State.InFenceBlock]: this.stateInFenceBlock.bind(this),
		[State.InMathBlock]: this.stateInMathBlock.bind(this),
		[State.BeforeLinkUrl]: this.stateBeforeLinkUrl.bind(this),
		[State.BeforeEmbedLink]: this.stateBeforeEmbedLink.bind(this),
		[State.InEmbedLink]: this.stateInEmbedLink.bind(this),
		[State.InLinkUrl]: this.stateInLinkUrl.bind(this),
	};

	consume(buffer) {
		this.buffer = buffer;
		this.size = this.buffer.length;
		this.index = this.sectionStart = 0;
		try {
			/* // biome-ignore format:
			if (this.index === 0 && this.buffer[0] === CharCode.Dash && this.buffer[1] === CharCode.Dash && this.buffer[2] === CharCode.Dash && this.buffer[3] === CharCode.LineBreak) {
				this.skipUptoSequence(Sequences.FrontMatter);
				this.emit("frontmatter", this.buffer.slice(4, this.index - 3));
				this.sectionStart = this.index;
			} */
			this.state && this.cursorStates[this.state]?.(this.buffer[this.index]);
			--this.index; // move back +1cursor

			while (++this.index < this.size) {
				const char = this.buffer[this.index];
				if (!Markers.has(char)) continue;
				this.markers[char] ? this.markers[char]() : TwinMarkers.has(char) && this.stateInlineMarker();
			}

			this.state ?? this.sendSpanText();
			this.emit("finish");
		} catch (error) {
			console.error(error);
			this.emit("error", error.message);
		}
	}

	stateInlineMarker() {
		TwinMarkers.has(this.buffer.slice(this.sectionStart, this.index)) || this.sendSpanText();
		if (this.buffer[this.index] === CharCode.OpeningSqrBracket) return this.stateBeforeLinkUrl();
		if (TwinMarkers.has(this.buffer[++this.index])) this.skipUntilMarker();
		const marker = this.buffer.slice(this.sectionStart, this.index);
		this.emit("twinmarker", marker);
		this.sectionStart = this.index;
		if (this.buffer[this.index] === CharCode.LineBreak) this.markers[CharCode.LineBreak]();
	}

	stateBeforeLinkUrl() {
		this.link ??= { title: "", url: "" };
		// biome-ignore format:
		if (this.buffer[this.index] === CharCode.ExclamationMark && this.buffer[++this.index] === CharCode.OpeningSqrBracket) {
			this.sectionStart = this.index;
			this.fastForwardTo(CharCode.ClosingSqrBracket);
			this.link.imgAlt = this.buffer.slice(this.sectionStart + 1, this.index);
			if (this.buffer[++this.index] === CharCode.OpeningParenthesis) {
				this.sectionStart = this.index;
				this.state = State.InLinkUrl;
				const stringEnd = this.fastForwardTo(CharCode.ClosingParenthesis);
				if (!stringEnd) return (this.link.imgUrl  = this.buffer.slice(this.sectionStart + 2, this.index));
				this.link.imgUrl = this.buffer.slice(this.sectionStart + 1, this.index);
				this.sectionStart = this.index;
				if (this.buffer[++this.index] !== CharCode.ClosingSqrBracket) return;
			}
		} else {
			this.buffer[this.index] === CharCode.OpeningSqrBracket && ++this.index;
			this.sectionStart = this.index;
			const stringEnd = this.fastForwardTo(CharCode.ClosingSqrBracket);
			this.link.title += this.buffer.slice(this.sectionStart, stringEnd ? this.index : this.index + 1);
			this.state = State.BeforeLinkUrl
			if(!stringEnd) return
		}

		if (this.buffer[++this.index] === CharCode.OpeningParenthesis) {
			this.state = State.InLinkUrl;
			this.sectionStart = ++this.index; //skip (
			this.stateInLinkUrl();
		} else (this.state = null), this.sectionStart--, this.sendTextData();
	}

	stateInLinkUrl() {
		const stringEnd = this.fastForwardTo(CharCode.ClosingParenthesis);
		if (!stringEnd) return (this.link.url += this.buffer.slice(this.sectionStart, this.index));
		this.link.url += this.buffer.slice(this.sectionStart, this.index);
		this.emit("linkurl", this.link.url, this.link.imgUrl ? this.link : this.link.title);
		this.link = null;
		this.state = null;
		this.sectionStart = ++this.index;
	}

	stateInFootNoteRef() {
		this.fastForwardTo(CharCode.ClosingSqrBracket);
		const link = this.buffer.slice(this.sectionStart + 2, this.index);
		this.emit("footnoteref", link);
		this.sectionStart = ++this.index;
	}

	stateInWikiLink() {
		this.fastForwardTo(CharCode.ClosingSqrBracket);
		const link = this.buffer.slice(this.sectionStart + 2, this.index); //+2 for skip [[
		if (this.buffer[++this.index] === CharCode.ClosingSqrBracket) {
			this.emit("wikilink", link);
			this.sectionStart = ++this.index;
		}
	}

	stateBeforeEmbedLink() {
		this.link ??= { title: "", url: "" };
		this.sectionStart = this.index;
		this.state = State.BeforeEmbedLink;
		const stringEnd = this.fastForwardTo(CharCode.ClosingSqrBracket);
		this.link.title += this.buffer.slice(this.sectionStart, this.index);
		if (!stringEnd) return;

		if (this.buffer[++this.index] === CharCode.OpeningParenthesis) {
			this.state = State.InEmbedLink;
			this.sectionStart = this.index;
			const stringEnd = this.fastForwardTo(CharCode.ClosingParenthesis);
			if (!stringEnd) return (this.link.url += this.buffer.slice(this.sectionStart + 1, this.index));
			this.stateInEmbedLink();
		}
	}

	stateInEmbedLink() {
		const stringEnd = this.fastForwardTo(CharCode.ClosingParenthesis);
		if (!stringEnd) return (this.link.url += this.buffer.slice(this.sectionStart, this.index));
		this.link.url += this.buffer.slice(this.sectionStart + 1, this.index);
		this.emit("image", this.link.url, this.link.title, true);
		this.link = null;
		this.state = null;
		this.sectionStart = ++this.index;
	}

	stateInHtml(isBlock) {
		if (this.buffer[++this.index] === CharCode.ExclamationMark) return this.skipComment();
		const openElem = [1];
		while (++this.index < this.size) {
			const char = this.buffer[this.index];
			if (char === CharCode.OpeningAngleBracket) {
				this.buffer[++this.index] === CharCode.Slash ? openElem.pop() : openElem.push(1);
				this.fastForwardTo(CharCode.ClosingSqrBracket);
			}
			if (openElem.length === 0) {
				const htmlStr = this.buffer.slice(this.sectionStart, this.index);
				this.emit("inserthtml", htmlStr, isBlock && this.buffer[this.index] === CharCode.LineBreak);
				this.sectionStart = this.index;
				if (this.buffer[this.index] === CharCode.LineBreak) --this.index;
				break;
			}
		}
	}

	skipComment() {
		this.index = this.index + 3; //skip !--
		this.sectionStart = this.index;
		this.skipUptoSequence(Sequences.CommentEnd);
		const commentStr = this.buffer.slice(this.sectionStart, this.index - 3);
		this.emit("insertcomment", commentStr);
		this.sectionStart = this.index;
	}

	stateInObsidianComment() {
		this.index = this.index + 2;
		this.sectionStart = this.index;
		this.skipUptoSequence("%%");
		const commentStr = this.buffer.slice(this.sectionStart, this.index - 2);
		this.emit("obsidiancomment", commentStr);
		this.sectionStart = this.index;
	}

	reset() {
		this.inlineCode = 0;
		this.index = 0;
		this.sectionStart = 0;
	}
}
