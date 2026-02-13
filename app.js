const catalog = {
  Foods: [
    'Tacos',
    'Sushi',
    'Fried Chicken',
    'Pho',
    'Pizza',
    'Burritos',
    'Ramen',
    'Mac and Cheese',
    'Jollof Rice',
    'Pupusas',
  ],
  'Dog Breeds': [
    'Golden Retriever',
    'French Bulldog',
    'German Shepherd',
    'Poodle',
    'Shiba Inu',
    'Corgi',
    'Labrador Retriever',
    'Dachshund',
  ],
  States: ['California', 'Hawaii', 'New York', 'Washington', 'Colorado', 'Texas', 'Oregon', 'Georgia'],
  'After-School Activities': [
    'Basketball',
    'Robotics',
    'Dance',
    'Debate',
    'Coding Club',
    'Theater',
    'Art Studio',
    'Music Practice',
  ],
  'School Subjects': [
    'Math',
    'Science',
    'History',
    'English',
    'Art',
    'Computer Science',
    'Geography',
    'Biology',
  ],
};

const BASE_RATING = 1000;
const K_FACTOR = 24;

const categorySelect = document.getElementById('category-select');
const undoButton = document.getElementById('undo-btn');
const roundStatus = document.getElementById('round-status');
const choiceAButton = document.getElementById('choice-a');
const choiceBButton = document.getElementById('choice-b');
const rankingList = document.getElementById('ranking-list');

const categoryState = {};
let currentCategory = 'Foods';
let activePair = null;

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function seededImage(name, category) {
  return `https://picsum.photos/seed/${slugify(category)}-${slugify(name)}/400/260`;
}

function createCategoryState(category) {
  const items = catalog[category].map((name) => ({
    id: `${slugify(category)}-${slugify(name)}`,
    name,
    image: seededImage(name, category),
    rating: BASE_RATING,
  }));

  return {
    comparisons: 0,
    history: [],
    items,
  };
}

function expectedScore(a, b) {
  return 1 / (1 + 10 ** ((b - a) / 400));
}

function updateRatings(winner, loser) {
  const winnerExpected = expectedScore(winner.rating, loser.rating);
  const loserExpected = expectedScore(loser.rating, winner.rating);

  const winnerBefore = winner.rating;
  const loserBefore = loser.rating;

  winner.rating = winner.rating + K_FACTOR * (1 - winnerExpected);
  loser.rating = loser.rating + K_FACTOR * (0 - loserExpected);

  return {
    winnerBefore,
    loserBefore,
  };
}

function selectPair(items) {
  if (items.length < 2) {
    return null;
  }

  const sampled = [...items].sort(() => Math.random() - 0.5).slice(0, Math.min(items.length, 6));
  let bestPair = [sampled[0], sampled[1]];
  let smallestGap = Math.abs(sampled[0].rating - sampled[1].rating);

  for (let i = 0; i < sampled.length; i += 1) {
    for (let j = i + 1; j < sampled.length; j += 1) {
      const gap = Math.abs(sampled[i].rating - sampled[j].rating);
      if (gap < smallestGap) {
        smallestGap = gap;
        bestPair = [sampled[i], sampled[j]];
      }
    }
  }

  if (Math.random() > 0.5) {
    return bestPair;
  }

  return [bestPair[1], bestPair[0]];
}

function renderChoice(button, item) {
  button.innerHTML = `
    <img src="${item.image}" alt="${item.name}" class="choice-card__image" loading="lazy" />
    <span class="choice-card__name">${item.name}</span>
    <span class="choice-card__meta">Tap to choose</span>
  `;
}

function sortedItemsForCurrentCategory() {
  const state = categoryState[currentCategory];
  return [...state.items].sort((a, b) => b.rating - a.rating);
}

function renderRankings() {
  const sorted = sortedItemsForCurrentCategory();

  rankingList.innerHTML = sorted
    .map(
      (item, index) => `
      <li class="ranking-item">
        <span class="ranking-item__position">#${index + 1}</span>
        <img class="ranking-item__image" src="${item.image}" alt="${item.name}" loading="lazy" />
        <span class="ranking-item__name">${item.name}</span>
        <span class="ranking-item__score">${Math.round(item.rating)} pts</span>
      </li>
    `,
    )
    .join('');
}

function renderStatus() {
  const state = categoryState[currentCategory];
  roundStatus.textContent = `${currentCategory}: ${state.comparisons} comparison${
    state.comparisons === 1 ? '' : 's'
  } logged.`;
  undoButton.disabled = state.history.length === 0;
}

function nextRound() {
  const state = categoryState[currentCategory];
  activePair = selectPair(state.items);

  if (!activePair) {
    return;
  }

  renderChoice(choiceAButton, activePair[0]);
  renderChoice(choiceBButton, activePair[1]);
}

function choose(winnerIndex) {
  if (!activePair) {
    return;
  }

  const state = categoryState[currentCategory];
  const winner = activePair[winnerIndex];
  const loser = activePair[winnerIndex === 0 ? 1 : 0];

  const { winnerBefore, loserBefore } = updateRatings(winner, loser);
  state.comparisons += 1;

  state.history.push({
    winnerId: winner.id,
    loserId: loser.id,
    winnerBefore,
    loserBefore,
  });

  renderRankings();
  renderStatus();
  nextRound();
}

function undoLastAnswer() {
  const state = categoryState[currentCategory];
  const last = state.history.pop();

  if (!last) {
    return;
  }

  const winner = state.items.find((item) => item.id === last.winnerId);
  const loser = state.items.find((item) => item.id === last.loserId);

  if (winner && loser) {
    winner.rating = last.winnerBefore;
    loser.rating = last.loserBefore;
    state.comparisons = Math.max(0, state.comparisons - 1);
  }

  renderRankings();
  renderStatus();
  nextRound();
}

function switchCategory(category) {
  currentCategory = category;
  if (!categoryState[category]) {
    categoryState[category] = createCategoryState(category);
  }

  renderRankings();
  renderStatus();
  nextRound();
}

function init() {
  Object.keys(catalog).forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.append(option);
  });

  categorySelect.value = currentCategory;
  switchCategory(currentCategory);

  choiceAButton.addEventListener('click', () => choose(0));
  choiceBButton.addEventListener('click', () => choose(1));
  undoButton.addEventListener('click', undoLastAnswer);
  categorySelect.addEventListener('change', (event) => switchCategory(event.target.value));
}

init();
