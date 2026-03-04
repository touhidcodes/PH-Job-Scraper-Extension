export async function autoScroll(step = 600, delay = 600) {
  const totalHeight = document.body.scrollHeight;
  let current = window.scrollY;

  while (current + window.innerHeight < totalHeight) {
    window.scrollBy(0, step);
    current += step;
    await new Promise((res) => setTimeout(res, delay));
  }
}
