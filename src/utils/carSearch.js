// Search + recommendation logic for cars. Pure functions, no React.

// How much a match in each field is worth. A model name beats a city.
const FIELD_WEIGHTS = { model: 100, brand: 60, tag: 30, fuel: 30, city: 20 };

function fieldsOf(car) {
  return {
    model: car.modelName ?? "",
    brand: car.company?.companyName ?? "",
    tag: car.tag ?? "",
    fuel: car.fuel ?? "",
    city: car.company?.companyCity ?? "",
  };
}

// 1 = text starts with the word, 0.8 = a later word starts with it, 0.5 = it appears inside, 0 = no match.
function matchStrength(text, token) {
  const t = text.toLowerCase();
  if (!t) return 0;
  if (t.startsWith(token)) return 1;
  if (t.includes(` ${token}`) || t.includes(`-${token}`)) return 0.8;
  if (token.length >= 3 && t.includes(token)) return 0.5; // 1-2 letters inside a word is just noise
  return 0;
}

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}

// Typo tolerance ("toyta" finds Toyota). Only used when nothing matched exactly.
function fuzzyStrength(text, token) {
  if (token.length < 4) return 0;
  const allowed = token.length <= 5 ? 1 : 2;
  const close = text
    .toLowerCase()
    .split(/[\s-]+/)
    .some(
      (word) =>
        editDistance(word, token) <= allowed ||
        editDistance(word.slice(0, token.length), token) <= allowed
    );
  return close ? 0.3 : 0;
}

function rank(cars, tokens, strengthOf) {
  const ranked = [];
  for (const car of cars) {
    const fields = Object.entries(fieldsOf(car));
    let score = 0;
    let matchedAll = true;

    for (const token of tokens) {
      let best = 0;
      for (const [name, text] of fields) {
        best = Math.max(best, strengthOf(text, token) * FIELD_WEIGHTS[name]);
      }
      if (best === 0) {
        matchedAll = false; // every typed word has to match something
        break;
      }
      score += best;
    }

    if (matchedAll) ranked.push({ car, score });
  }
  return ranked;
}

// All cars that match the typed text, best match first. Cheaper car wins a tie.
export function searchCars(cars, query) {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  let ranked = rank(cars, tokens, matchStrength);
  if (ranked.length === 0) ranked = rank(cars, tokens, fuzzyStrength);

  ranked.sort((a, b) => b.score - a.score || a.car.pricePerHour - b.car.pricePerHour);
  return ranked.map((r) => r.car);
}

// "You may also like": same type, brand, fuel, city and a similar price score higher.
export function similarCars(car, cars, limit = 4) {
  return cars
    .filter((c) => c.carId !== car.carId)
    .map((c) => {
      let score = 0;
      if (c.tag && c.tag === car.tag) score += 4;
      if (c.company?.companyName === car.company?.companyName) score += 3;
      if (c.fuel === car.fuel) score += 2;
      if (c.company?.companyCity === car.company?.companyCity) score += 1;
      if (c.seats === car.seats) score += 1;

      const priceGap = Math.abs(c.pricePerHour - car.pricePerHour) / Math.max(car.pricePerHour, 1);
      score += Math.max(0, 3 - priceGap * 3); // up to 3 points for a close price

      return { car: c, score, priceGap };
    })
    .sort((a, b) => b.score - a.score || a.priceGap - b.priceGap)
    .slice(0, limit)
    .map((r) => r.car);
}

// Shown when the search box is focused but empty.
export function budgetPicks(cars, excludeIds, limit = 3) {
  return cars
    .filter((c) => !excludeIds.includes(c.carId))
    .sort((a, b) => a.pricePerHour - b.pricePerHour)
    .slice(0, limit);
}

// ── Recently viewed cars (kept in this browser only) ──
const RECENT_KEY = "drivex_recent_cars";

export function getRecentCarIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(RECENT_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function pushRecentCarId(carId) {
  try {
    const next = [carId, ...getRecentCarIds().filter((id) => id !== carId)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // storage blocked: recently viewed is a nice extra, so just skip it
  }
}
