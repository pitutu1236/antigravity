// App State
let moviesData = [];
let filteredMovies = [];
let activeEra = 'all';
let searchQuery = '';
let currentSort = 'rank-asc';

// Aesthetic Gradients List (Deterministic based on Rank)
const gradients = [
  'linear-gradient(135deg, hsl(263, 60%, 35%) 0%, hsl(328, 65%, 40%) 100%)', // Purple -> Pink
  'linear-gradient(135deg, hsl(200, 75%, 30%) 0%, hsl(185, 80%, 35%) 100%)', // Blue -> Cyan
  'linear-gradient(135deg, hsl(280, 60%, 35%) 0%, hsl(200, 70%, 35%) 100%)', // Violet -> Blue
  'linear-gradient(135deg, hsl(340, 65%, 35%) 0%, hsl(20, 75%, 40%) 100%)',  // Pink -> Orange
  'linear-gradient(135deg, hsl(150, 60%, 25%) 0%, hsl(190, 70%, 35%) 100%)', // Green -> Cyan
  'linear-gradient(135deg, hsl(310, 60%, 35%) 0%, hsl(250, 65%, 40%) 100%)'  // Magenta -> Deep Violet
];

// DOM Elements
const moviesGrid = document.getElementById('movies-grid');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const eraBtns = document.querySelectorAll('.tab-btn');
const sortSelect = document.getElementById('sort-select');
const moviesCount = document.getElementById('movies-count');

// Modal Elements
const trailerModal = document.getElementById('trailer-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalVideoWrapper = document.querySelector('.modal-video-wrapper');
const modalRank = document.getElementById('modal-rank');
const modalTitleOriginal = document.getElementById('modal-title-original');
const modalTitleSpanish = document.getElementById('modal-title-spanish');
const modalYear = document.getElementById('modal-year');
const modalExternalLink = document.getElementById('modal-external-link');

/* ==========================================================================
   INITIALIZATION & DATA LOADING
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  fetchMoviesData();
  setupEventListeners();
});

async function fetchMoviesData() {
  try {
    const response = await fetch('movies_data.json');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    moviesData = await response.json();
    filteredMovies = [...moviesData];
    
    updateUI();
  } catch (error) {
    console.error('Error fetching movie data:', error);
    moviesGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-circle-exclamation" style="color: var(--accent-pink);"></i>
        <p>No se pudo cargar el catálogo de películas. Inténtalo más tarde.</p>
        <span style="font-size: 0.8rem; color: var(--text-muted);">${error.message}</span>
      </div>
    `;
    moviesCount.textContent = 'Error al cargar';
  }
}

/* ==========================================================================
   EVENT LISTENERS Setup
   ========================================================================== */
function setupEventListeners() {
  // Search Events
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
    filterAndRender();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    searchInput.focus();
    filterAndRender();
  });

  // Era Filter Tabs
  eraBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      eraBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeEra = e.target.dataset.era;
      filterAndRender();
    });
  });

  // Sort Event
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    filterAndRender();
  });

  // Surprise / Random Movie Event removed (button deleted)

  // Modal Events
  closeModalBtn.addEventListener('click', closeModal);
  trailerModal.addEventListener('click', (e) => {
    if (e.target === trailerModal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && trailerModal.classList.contains('open')) {
      closeModal();
    }
  });
}

/* ==========================================================================
   FILTER, SORT & RENDER LOGIC
   ========================================================================== */
function filterAndRender() {
  // 1. Filter by Search Query & Era
  filteredMovies = moviesData.filter(movie => {
    // Text search matching (original title, Spanish title, or year)
    const matchesSearch = 
      movie.originalTitle.toLowerCase().includes(searchQuery) ||
      movie.spanishTitle.toLowerCase().includes(searchQuery) ||
      String(movie.year).includes(searchQuery);
      
    // Era filter matching
    let matchesEra = true;
    if (activeEra === '2020s') {
      matchesEra = movie.year >= 2020;
    } else if (activeEra === '2010s') {
      matchesEra = movie.year >= 2010 && movie.year < 2020;
    } else if (activeEra === '2000s') {
      matchesEra = movie.year >= 2000 && movie.year < 2010;
    }
    
    return matchesSearch && matchesEra;
  });

  // 2. Sort
  sortMovies();

  // 3. Render
  updateUI();
}

function sortMovies() {
  switch (currentSort) {
    case 'rank-asc':
      filteredMovies.sort((a, b) => a.rank - b.rank);
      break;
    case 'rank-desc':
      filteredMovies.sort((a, b) => b.rank - a.rank);
      break;
    case 'year-desc':
      filteredMovies.sort((a, b) => b.year - a.year || a.rank - b.rank);
      break;
    case 'year-asc':
      filteredMovies.sort((a, b) => a.year - b.year || a.rank - b.rank);
      break;
  }
}

function updateUI() {
  // Update stats counter
  if (filteredMovies.length === 100) {
    moviesCount.textContent = 'Mostrando las 100 películas del siglo XXI';
  } else {
    moviesCount.textContent = `Mostrando ${filteredMovies.length} de ${moviesData.length} películas`;
  }

  // Render Grid
  if (filteredMovies.length === 0) {
    moviesGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-film-slash"></i>
        <p>No se encontraron películas que coincidan con tu búsqueda.</p>
      </div>
    `;
    return;
  }

  moviesGrid.innerHTML = '';
  filteredMovies.forEach((movie, index) => {
    const card = createMovieCard(movie, index);
    moviesGrid.appendChild(card);
  });
}

function createMovieCard(movie, index) {
  const card = document.createElement('div');
  card.className = 'movie-card';
  card.setAttribute('data-rank', movie.rank);
  
  // Custom deterministic gradient based on rank
  const gradient = gradients[(movie.rank - 1) % gradients.length];
  
  card.innerHTML = `
    <div class="movie-poster-placeholder">
      <div class="poster-bg" style="background: ${gradient};"></div>
      ${movie.youtubeId ? `<img class="poster-img" src="https://img.youtube.com/vi/${movie.youtubeId}/hqdefault.jpg" alt="Poster de ${movie.originalTitle}" loading="lazy">` : ''}
      <div class="poster-content">
        <div class="play-overlay-btn">
          <i class="fa-solid fa-play"></i>
        </div>
      </div>
      <span class="rank-overlay">#${movie.rank}</span>
    </div>
    <div class="movie-details">
      <div class="movie-meta">
        <span class="movie-rank">Puesto #${movie.rank}</span>
        <span class="movie-year">${movie.year}</span>
      </div>
      <h3>${movie.originalTitle}</h3>
      <p class="spanish-title">${movie.spanishTitle}</p>
      <div class="card-action">
        <span>Ver Tráiler</span>
        <i class="fa-solid fa-arrow-right"></i>
      </div>
    </div>
  `;

  // Hide broken thumbnail images gracefully
  const imgEl = card.querySelector('.poster-img');
  if (imgEl) {
    imgEl.addEventListener('error', () => {
      imgEl.style.display = 'none';
    });
  }

  // Open modal on click
  card.addEventListener('click', () => openTrailer(movie));

  return card;
}

/* ==========================================================================
   TRAILER MODAL CONTROL
   ========================================================================== */
function openTrailer(movie) {
  // Set text contents
  modalRank.textContent = `#${movie.rank}`;
  modalTitleOriginal.textContent = movie.originalTitle;
  modalTitleSpanish.textContent = movie.spanishTitle;
  modalYear.textContent = movie.year;
  modalExternalLink.href = movie.searchUrl;

  // Build the modal poster; inject iframe only when user clicks Play
  if (movie.youtubeId) {
    modalVideoWrapper.innerHTML = `
      <div class="modal-poster" data-yid="${movie.youtubeId}">
        <img src="https://img.youtube.com/vi/${movie.youtubeId}/hqdefault.jpg" alt="Tráiler de ${movie.originalTitle}" loading="lazy">
        <button id="modal-play-btn" class="modal-play-btn" aria-label="Reproducir tráiler">
          <i class="fa-solid fa-play"></i>
        </button>
      </div>
    `;

    // Play button will create the iframe (user gesture -> avoids autoplay restrictions)
    const playBtn = modalVideoWrapper.querySelector('#modal-play-btn');
    playBtn.addEventListener('click', () => {
      const yid = modalVideoWrapper.querySelector('.modal-poster').dataset.yid;
      modalVideoWrapper.innerHTML = `
        <iframe 
          src="https://www.youtube-nocookie.com/embed/${yid}?autoplay=1&rel=0" 
          title="Tráiler de ${movie.originalTitle}" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowfullscreen>
        </iframe>
      `;
    });
  } else {
    // If no video ID was successfully scraped, show fallback search box
    modalVideoWrapper.innerHTML = `
      <div class="player-placeholder" style="background: #000; flex-direction: column; gap: 1rem; padding: 2rem; text-align: center;">
        <i class="fa-solid fa-circle-info" style="font-size: 2.5rem; color: var(--accent-pink);"></i>
        <p style="color: var(--text-secondary); max-width: 400px;">El tráiler incrustado no está disponible para esta película.</p>
        <a href="${movie.searchUrl}" target="_blank" class="btn btn-primary" style="margin-top: 0.5rem;">
          <i class="fa-brands fa-youtube"></i> Buscar tráiler en YouTube
        </a>
      </div>
    `;
  }

  // Open modal animation
  trailerModal.classList.add('open');
  document.body.style.overflow = 'hidden'; // Stop background scrolling
}

function closeModal() {
  // Clear the iframe to immediately stop any playing audio/video
  modalVideoWrapper.innerHTML = `
    <div class="player-placeholder">
      <div class="spinner"></div>
    </div>
  `;
  
  // Close modal animation
  trailerModal.classList.remove('open');
  document.body.style.overflow = ''; // Restore scroll
}

function playRandomTrailer() {
  const sourceList = filteredMovies.length > 0 ? filteredMovies : moviesData;
  if (sourceList.length === 0) return;
  
  const randomIndex = Math.floor(Math.random() * sourceList.length);
  const randomMovie = sourceList[randomIndex];
  openTrailer(randomMovie);
}
