function toggleDetails() {
  const details = document.getElementById('details');
  const button = document.querySelector('.more-button');

  if (details.classList.contains('visible')) {
    details.classList.remove('visible');
    button.textContent = 'Ещё ↓';
  } else {
    details.classList.add('visible');
    button.textContent = 'Скрыть ↑';
  }
}
