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

const likeButton = document.querySelector('[data-like-button]');

if (likeButton) {
  const heart = likeButton.querySelector('.heart');
  const likeCount = likeButton.querySelector('.like-count');
  const initialCount = Number(likeCount.textContent) || 0;

  likeButton.addEventListener('click', () => {
    const isLiked = likeButton.classList.toggle('liked');

    heart.textContent = isLiked ? '♥' : '♡';
    likeCount.textContent = String(initialCount + (isLiked ? 1 : 0));
    likeButton.setAttribute('aria-pressed', String(isLiked));
  });
}
