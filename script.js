document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener("click", (event) => {
  const href = link.getAttribute("href");
  if (!href.startsWith("#")) return;
  const target = document.querySelector(href);
  if (target) { event.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
}));

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const metadataRow = (label, value) => {
  const row = element("div");
  row.append(element("dt", "", label), element("dd", "", value));
  return row;
};

const renderGame = ({ schemaVersion, number, game, generation }, position) => {
  const gameUrl = `games/${game.slug}/`;
  const article = element("article", "card");
  const preview = element("a", "preview");
  preview.href = gameUrl;

  const image = element("img");
  image.src = game.preview;
  image.alt = `${game.name} game preview`;
  image.loading = position === 0 ? "eager" : "lazy";
  preview.append(image, element("span", "play-pill", "▶ Play now"), element("span", "number", `#${String(number).padStart(3, "0")}`));

  const body = element("div", "card-body");
  const kicker = element("div", "kicker");
  const genre = element("span", "", game.genre);
  const date = element("time", "", new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${game.createdAt}T00:00:00Z`)));
  date.dateTime = game.createdAt;
  kicker.append(genre, date);

  const title = element("h3");
  const titleLink = element("a", "", game.name);
  titleLink.href = gameUrl;
  title.append(titleLink);

  const details = element("details", "game-details");
  details.append(element("summary", "", "Game details"));
  const metadata = element("dl", "game-meta");
  metadata.append(
    metadataRow("Model", generation.model),
    metadataRow("Slug", game.slug),
    metadataRow("Controls", game.controls.join(" · ")),
    metadataRow("Schema", `v${schemaVersion}`),
  );
  const prompt = element("div", "prompt-copy");
  prompt.append(element("span", "", "Generation prompt"), element("p", "", generation.prompt));
  details.append(metadata, prompt);

  const footer = element("footer", "card-footer");
  const author = element("span", "author");
  author.append("Created by ", element("strong", "", generation.author), element("span", "author-separator", "·"), "Harness ", element("strong", "", generation.harness));
  const promptLink = element("a", "", "prompt.json ↗");
  promptLink.href = `${gameUrl}prompt.json`;
  footer.append(author, promptLink);

  body.append(kicker, title, element("p", "", game.description), details, footer);
  article.append(preview, body);
  return article;
};

const loadGames = async () => {
  const grid = document.querySelector("#game-grid");
  try {
    const response = await fetch("games.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const games = await response.json();

    grid.replaceChildren(...games.map(renderGame));
    document.querySelector("#game-count").textContent = String(games.length).padStart(2, "0");
    document.querySelector("#game-count-label").textContent = games.length === 1 ? "game online" : "games online";
    if (games[0]) document.querySelector("#latest-game-link").href = `games/${games[0].game.slug}/`;
  } catch (error) {
    console.error("Could not load the game manifest", error);
    grid.replaceChildren(element("p", "loading-games", "The arcade could not be loaded. Please try again later."));
  }
};

loadGames();
