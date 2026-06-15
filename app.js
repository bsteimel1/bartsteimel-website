async function buildCatalog() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;
  try {
    const res = await fetch('songs.json');
    const songs = await res.json();
    grid.innerHTML = songs.map(song => {
      const safeTitle = song.title.replace(/'/g, "\\'");
      const safeSpotify = song.spotify || '';
      const safeStory = (song.story || '').replace(/'/g, "\\'");
      const safeImage = (song.image || '').replace(/'/g, "\\'");
      return `
        <div class="catalog-item" onclick="openModal('${safeTitle}', '${song.appleMusic}', '${song.year}', '${safeSpotify}', '${safeStory}', '${safeImage}')">
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





  // Store current song for the story viewer
  var currentSong = {};

  function openModal(title, link, year, spotifyLink, storyFile, imagePath) {
    currentSong = { title, link, year, spotifyLink, storyFile: storyFile || '', imagePath: imagePath || '' };
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
    var storyBtn = document.getElementById('modalStoryBtn');
    if (storyBtn) storyBtn.style.display = storyFile ? 'block' : 'none';
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
    if (e.key === 'Escape') {
      closeStoryViewer();
      closeModal({target: document.getElementById('catalogModal')});
    }
  });

  // ── Story Viewer ──────────────────────────────────────────────────────────

  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
  }

  async function openStoryViewer() {
    var title = currentSong.title;
    var storyFile = currentSong.storyFile;
    var imagePath = currentSong.imagePath;
    var listenLink = currentSong.link;

    // Close the catalog modal first
    document.getElementById('catalogModal').classList.remove('active');

    // Populate static fields
    var artEl = document.getElementById('storyViewerArt');
    artEl.src = imagePath;
    artEl.alt = title + ' cover art';
    document.getElementById('storyViewerArtCol').style.setProperty('--story-art-bg', 'url(' + imagePath + ')');
    document.getElementById('storyViewerArtTitle').textContent = title;
    document.getElementById('storyViewerListenLink').href = listenLink;
    document.getElementById('storyViewerTitle').textContent = title;
    document.getElementById('storyViewerBody').innerHTML =
      '<p style="color:var(--mid);font-style:italic;">Loading the story…</p>';

    document.getElementById('storyViewer').classList.add('active');
    document.body.style.overflow = 'hidden';

    // Load and render PDF
    try {
      if (typeof pdfjsLib === 'undefined') throw new Error('PDF library not loaded');
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

      var encodedStoryFile = storyFile.split('/').map(encodeURIComponent).join('/');
      var pdf = await pdfjsLib.getDocument(encodedStoryFile).promise;
      var allItems = [];
      var pageWidth = 0;
      for (var p = 1; p <= pdf.numPages; p++) {
        var page = await pdf.getPage(p);
        if (!pageWidth) {
          var vp = page.getViewport({ scale: 1 });
          pageWidth = vp.width;
        }
        var content = await page.getTextContent();
        allItems = allItems.concat(content.items);
      }

      var paragraphs = pdfItemsToParagraphs(allItems, title, pageWidth);
      document.getElementById('storyViewerBody').innerHTML =
        paragraphs.map(function(text, i) {
          return '<p class="' + (i === 0 ? 'story-lead' : '') + '">' + escapeHtml(text) + '</p>';
        }).join('');
    } catch (err) {
      console.error('Story load error:', err);
      document.getElementById('storyViewerBody').innerHTML =
        '<p style="color:var(--mid);">Story could not be loaded.</p>';
    }
  }

  function closeStoryViewer() {
    var viewer = document.getElementById('storyViewer');
    if (viewer) {
      viewer.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function findColumnSplitX(items, pageWidth) {
    // Build a coverage map using actual bounding boxes (x + width) of each text item.
    // The column gutter shows up as a wide uncovered strip in the middle of the page.
    if (!pageWidth || pageWidth <= 0) return null;
    var bins = Math.ceil(pageWidth) + 2;
    var coverage = new Uint8Array(bins);
    items.forEach(function(item) {
      var left  = Math.floor(item.transform[4]);
      var right = Math.ceil(item.transform[4] + (item.width || 0));
      for (var b = Math.max(0, left); b < Math.min(bins, right + 1); b++) coverage[b] = 1;
    });

    // Find the widest uncovered gap in the middle 60% of the page
    var lo = Math.floor(pageWidth * 0.2), hi = Math.ceil(pageWidth * 0.8);
    var maxGap = 0, bestMid = null, gapStart = null;
    for (var x = lo; x <= hi; x++) {
      if (!coverage[x]) {
        if (gapStart === null) gapStart = x;
      } else {
        if (gapStart !== null) {
          var w = x - gapStart;
          if (w > maxGap) { maxGap = w; bestMid = (gapStart + x) / 2; }
          gapStart = null;
        }
      }
    }
    return maxGap >= 10 ? bestMid : null;
  }

  function pdfItemsToParagraphs(items, songTitle, pageWidth) {
    var nonEmpty = items.filter(function(i) { return i.str && i.str.trim(); });
    if (!nonEmpty.length) return [];

    var splitX = findColumnSplitX(nonEmpty, pageWidth);

    var paragraphs;
    if (splitX) {
      var leftItems  = nonEmpty.filter(function(i) { return i.transform[4] <  splitX; });
      var rightItems = nonEmpty.filter(function(i) { return i.transform[4] >= splitX; });
      paragraphs = singleColToParagraphs(leftItems).concat(singleColToParagraphs(rightItems));
    } else {
      paragraphs = singleColToParagraphs(nonEmpty);
    }

    // Strip leading title paragraph if it matches the song title
    if (paragraphs.length && paragraphs[0].trim().toLowerCase() === songTitle.trim().toLowerCase()) {
      paragraphs.shift();
    }
    return paragraphs;
  }

  function singleColToParagraphs(nonEmpty) {
    if (!nonEmpty.length) return [];

    // Sort top-to-bottom (PDF Y increases upward)
    var sorted = nonEmpty.slice().sort(function(a, b) {
      var dy = b.transform[5] - a.transform[5];
      if (Math.abs(dy) > 3) return dy;
      return a.transform[4] - b.transform[4];
    });

    // Estimate line height (median font height)
    var heights = sorted.map(function(i) { return Math.abs(i.transform[3]); }).filter(function(h) { return h > 0; });
    heights.sort(function(a, b) { return a - b; });
    var medH = heights[Math.floor(heights.length / 2)] || 12;

    // Group into visual lines
    var lines = [], curLine = null, curY = null;
    sorted.forEach(function(item) {
      var y = item.transform[5];
      if (curY === null || Math.abs(y - curY) > medH * 0.6) {
        if (curLine !== null) lines.push({ y: curY, text: curLine });
        curLine = item.str;
        curY = y;
      } else {
        curLine += item.str;
      }
    });
    if (curLine !== null) lines.push({ y: curY, text: curLine });

    // Group lines into paragraphs by blank-line gaps
    var paragraphs = [], paraLines = [];
    for (var i = 0; i < lines.length; i++) {
      if (i === 0) { paraLines.push(lines[i].text); continue; }
      var gap = Math.abs(lines[i - 1].y - lines[i].y);
      if (gap > medH * 1.8) {
        var txt = paraLines.join(' ').trim();
        if (txt) paragraphs.push(txt);
        paraLines = [lines[i].text];
      } else {
        paraLines.push(lines[i].text);
      }
    }
    var last = paraLines.join(' ').trim();
    if (last) paragraphs.push(last);
    return paragraphs;
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

async function buildKidsCatalog() {
  const grid = document.getElementById('kids-catalog-grid');
  if (!grid) return;
  try {
    const res = await fetch('songs.json');
    const songs = await res.json();
    const kidsSongs = songs.filter(s => s.kids);
    grid.innerHTML = kidsSongs.map(song => {
      const safeTitle = song.title.replace(/'/g, "\\'");
      const safeSpotify = song.spotify || '';
      const safeStory = (song.story || '').replace(/'/g, "\\'");
      const safeImage = (song.image || '').replace(/'/g, "\\'");
      return `
        <div class="catalog-item" onclick="openModal('${safeTitle}', '${song.appleMusic}', '${song.year}', '${safeSpotify}', '${safeStory}', '${safeImage}')">
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
    console.error('Failed to load kids songs:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  buildCatalog();
  buildKidsCatalog();
});
