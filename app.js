async function buildCatalog() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;
  try {
    const res = await fetch('songs.json');
    const songs = await res.json();
    grid.innerHTML = songs.map(song => {
      const safeTitle = song.title.replace(/'/g, "\\'");
      const safeSpotify = song.spotify || '';
      return `
        <div class="catalog-item" onclick="openModal('${safeTitle}', '${song.appleMusic}', '${song.year}', '${safeSpotify}')">
          <img src="${song.image}" alt="${safeTitle} cover art" loading="lazy">
          <div class="catalog-overlay">
            <span class="catalog-title">${song.title}</span>
            <span class="catalog-year">${song.year}</span>
          </div>
        </div>
      `;
    }).join('');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(el => {
        if (el.isIntersecting) {
          el.target.style.opacity = '1';
          el.target.style.transform = 'translateY(0)';
        }
      });
    });
    grid.querySelectorAll('.catalog-item').forEach(item => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(item);
    });
  } catch (err) {
    console.error('Failed to load songs:', err);
  }
}

function handleSignup(e) {
    e.preventDefault();
    const form = e.target;
    const input = form.querySelector('input[type="email"]');
    const msg = document.getElementById('signup-msg');
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    })
    .then(() => {
      msg.textContent = "Thanks — you're on the list.";
      msg.style.color = '#c9912a';
      input.value = '';
    })
    .catch(() => {
      msg.textContent = "Thanks — you're on the list.";
      msg.style.color = '#c9912a';
      input.value = '';
    });
  }





  function openModal(title, link, year, spotifyLink) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalYear').textContent = 'Written ' + year;
    document.getElementById('modalLink').href = link;
    var spotifyBtn = document.getElementById('modalSpotifyListenBtn');
    if (spotifyLink) {
      spotifyBtn.href = spotifyLink;
      spotifyBtn.style.display = 'flex';
      document.getElementById('modalSpotifyBtn').href = spotifyLink;
    } else {
      spotifyBtn.style.display = 'none';
      document.getElementById('modalSpotifyBtn').href = 'https://open.spotify.com/artist/2n7ZGuaqXqTJBbHKsr7H79';
    }
    document.getElementById('catalogModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(e) {
    if (!e || e.target === document.getElementById('catalogModal') || (e.target.classList && e.target.classList.contains('modal-close'))) {
      document.getElementById('catalogModal').classList.remove('active');
      document.body.style.overflow = '';
    }
  }
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal({target: document.getElementById('catalogModal')});
  });

document.addEventListener('DOMContentLoaded', buildCatalog);
