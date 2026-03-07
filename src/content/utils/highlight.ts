let currentHighlighted: HTMLElement | null = null;
let originalBackground: string = "";
let originalTransition: string = "";

export function highlight(el: Element) {
  if (!(el instanceof HTMLElement)) return;

  // Restore previous element
  if (currentHighlighted) {
    currentHighlighted.style.outline = "";
    currentHighlighted.style.backgroundColor = originalBackground;
    currentHighlighted.style.transition = originalTransition;
  }

  // Store original state
  currentHighlighted = el;
  originalBackground = el.style.backgroundColor;
  originalTransition = el.style.transition;

  // Apply highlight
  el.style.transition = "all 0.3s ease";
  el.style.outline = "3px solid #22c55e";
  el.style.backgroundColor = "rgba(34, 197, 94, 0.1)"; // Subtle green background
  
  // Auto scroll
  el.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

export function clearHighlight() {
  if (currentHighlighted) {
    currentHighlighted.style.outline = "";
    currentHighlighted.style.backgroundColor = originalBackground;
    currentHighlighted.style.transition = originalTransition;
    currentHighlighted = null;
  }
}
