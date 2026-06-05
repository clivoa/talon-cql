import { Plugin } from "obsidian";
import { highlightCQL } from "./cql-highlight";

export default class TalonCQLPlugin extends Plugin {
	async onload() {
		this.registerMarkdownCodeBlockProcessor("cql", (source, el) => {
			el.innerHTML = "";
			el.appendChild(highlightCQL(source, "CQL"));
		});

		this.registerMarkdownCodeBlockProcessor("logscale", (source, el) => {
			el.innerHTML = "";
			el.appendChild(highlightCQL(source, "LogScale"));
		});
	}

	onunload() {}
}
