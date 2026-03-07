export async function autoScroll(step = 600, delay = 600, maxSteps = Infinity) {
  const totalHeight = document.body.scrollHeight;
  let current = window.scrollY;
  let steps = 0;

  while (current + window.innerHeight < totalHeight && steps < maxSteps) {
    window.scrollBy(0, step);
    current += step;
    steps++;
    await new Promise((res) => setTimeout(res, delay));
  }
}
