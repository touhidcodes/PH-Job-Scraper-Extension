export const cleanText = (text?: string | null) =>
  (text ?? "").replace(/\s+/g, " ").trim();

export const extractText = (el: Element | null) => cleanText(el?.textContent);

export const extractAttr = (el: Element | null, attr: string) =>
  cleanText(el?.getAttribute(attr));
