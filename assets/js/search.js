document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('calc-search');
  const cards = document.querySelectorAll('.calc-card');
  const emptyMsg = document.getElementById('no-results');

  if (!searchInput) return;

  const normalize = (str) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  searchInput.addEventListener('input', (e) => {
    const query = normalize(e.target.value.trim());
    let visibleCount = 0;

    cards.forEach((card) => {
      const title = normalize(card.querySelector('h3')?.textContent || '');
      const desc = normalize(card.querySelector('p')?.textContent || '');
      const keywords = normalize(card.dataset.keywords || '');

      const matches = title.includes(query) || desc.includes(query) || keywords.includes(query);
      card.style.display = matches ? 'flex' : 'none';
      if (matches) visibleCount++;
    });

    if (emptyMsg) {
      emptyMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  });
});
