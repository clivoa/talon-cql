import { MarkdownPostProcessorContext, MarkdownView, Plugin } from "obsidian";
import { highlightCQL } from "./cql-highlight";

export default class TalonCQLPlugin extends Plugin {
	async onload() {
		this.registerMarkdownCodeBlockProcessor("cql", (source, el, ctx) => {
			el.innerHTML = "";
			const block = highlightCQL(source, "CQL");
			this.addClickToEdit(block, el, ctx);
			el.appendChild(block);
		});

		this.registerMarkdownCodeBlockProcessor("logscale", (source, el, ctx) => {
			el.innerHTML = "";
			const block = highlightCQL(source, "LogScale");
			this.addClickToEdit(block, el, ctx);
			el.appendChild(block);
		});
	}

	private addClickToEdit(
		block: HTMLElement,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	) {
		block.addEventListener("click", (e: MouseEvent) => {
			// Let copy button handle its own clicks
			if ((e.target as HTMLElement).closest(".cql-copy-btn")) return;

			const info = ctx.getSectionInfo(el);
			if (!info) return;

			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view) return;

			// Place cursor on the first content line (skip the opening fence)
			view.editor.setCursor({ line: info.lineStart + 1, ch: 0 });
			view.editor.focus();
		});
	}

	onunload() {}
}
