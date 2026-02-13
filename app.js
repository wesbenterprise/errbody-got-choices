const startButton = document.getElementById('start-tour');
const cards = [...document.querySelectorAll('.tier-card')];
const teasers = [...document.querySelectorAll('.teaser')];

let activeTier = 0;

function setActiveTier(index) {
  cards.forEach((card, i) => {
    card.classList.toggle('is-active', i === index);
  });

  teasers.forEach((teaser) => {
    const unlockTier = Number(teaser.dataset.unlock);
    const shouldReveal = unlockTier <= index + 1;

    teaser.classList.toggle('hidden', !shouldReveal);
    teaser.classList.toggle('revealed', shouldReveal);
  });
}

function runJourney() {
  startButton.disabled = true;
  startButton.textContent = 'Flow in progress...';

  const sequence = [0, 1, 2];
  sequence.forEach((tier, step) => {
    setTimeout(() => {
      activeTier = tier;
      setActiveTier(activeTier);

      if (step === sequence.length - 1) {
        startButton.textContent = 'Run it back';
        startButton.disabled = false;
      }
    }, step * 900);
  });
}

startButton.addEventListener('click', runJourney);
setActiveTier(activeTier);
