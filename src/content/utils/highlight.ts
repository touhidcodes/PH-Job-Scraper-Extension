let currentHighlighted: HTMLElement | null = null;

export function highlight(el: Element) {
  if (!(el instanceof HTMLElement)) return;

  if (currentHighlighted) {
    currentHighlighted.style.outline = "";
  }

  currentHighlighted = el;
  el.style.outline = "3px solid #22c55e";
  el.style.transition = "outline 0.2s ease";
}
