import { timeline, photoEl } from "../images.js";

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// "Hvilket år var dette?" – bilder fra tidslinjen, fire svaralternativer.
export async function render(el) {
  el.innerHTML = "<h1>Quiz</h1>";
  const items = (await timeline()).filter((t) => t.jorunnImage || t.worldImage);
  const years = [...new Set(items.map((t) => t.year))];
  if (items.length < 2 || years.length < 4) { el.append("Trenger minst fire ulike år på tidslinjen."); return; }

  const box = Object.assign(document.createElement("div"), { className: "card" });
  el.append(box);
  const questions = shuffle(items.slice()).slice(0, 10);
  let i = 0, score = 0;

  function next() {
    if (i >= questions.length) {
      box.replaceChildren(Object.assign(document.createElement("h2"), { textContent: `Du fikk ${score} av ${questions.length}!` }));
      const b = Object.assign(document.createElement("button"), { textContent: "Spill igjen" });
      b.onclick = () => { shuffle(questions); i = 0; score = 0; next(); };
      box.append(b);
      return;
    }
    const q = questions[i];
    const useWorld = q.worldImage && (!q.jorunnImage || Math.random() < 0.5);
    const imgId = useWorld ? q.worldImage : q.jorunnImage;
    const opts = shuffle([q.year, ...shuffle(years.filter((y) => y !== q.year)).slice(0, 3)]);
    const photo = photoEl(imgId, { zoom: false });
    photo.classList.add("free");
    const info = Object.assign(document.createElement("p"), { className: "muted", textContent: `Spørsmål ${i + 1} av ${questions.length}` });
    const title = Object.assign(document.createElement("h2"), { textContent: "Hvilket år var dette?" });
    const answers = Object.assign(document.createElement("div"), { className: "row" });
    const fb = Object.assign(document.createElement("div"), { className: "status" });
    for (const y of opts) {
      const b = Object.assign(document.createElement("button"), { textContent: y });
      b.onclick = () => {
        answers.querySelectorAll("button").forEach((x) => {
          x.disabled = true;
          if (+x.textContent === q.year) x.style.background = "#2e8b57";
        });
        if (y === q.year) { score++; fb.textContent = "Riktig! 🎉"; }
        else { b.style.background = "#c0392b"; fb.textContent = `Det var ${q.year}.`; }
        const more = Object.assign(document.createElement("button"), { textContent: "Neste", className: "secondary" });
        more.onclick = () => { i++; next(); };
        answers.after(more);
      };
      answers.append(b);
    }
    box.replaceChildren(info, title, photo, answers, fb);
  }
  next();
}
