import './style.css';
import { withAuth, isAuthenticated } from './auth-utils';
import config from './config.js';
import { initializeTopPicks } from './top-picks.js';

const promptForm = document.getElementById('promptForm');
const promptInput = document.getElementById('promptInput');
const movieRecommendations = document.getElementById('movieRecommendations');
const loadingIndicator = document.getElementById('loadingIndicator');
const themeSwitcher = document.getElementById('themeSwitcher');

window.addEventListener('DOMContentLoaded', () => {
  // Clear navigation history when returning to main page
  sessionStorage.removeItem('navigationHistory');
  
  // Initialize Top Picks for authenticated users
  initializeTopPicks();
  
  const savedMovies = sessionStorage.getItem('movieRecommendations');
  if (savedMovies) {
    const movies = JSON.parse(savedMovies);
    if (movies.length > 0) {
      movieRecommendations.classList.add('grid', 'grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3');
      movieRecommendations.classList.remove('flex', 'items-center', 'justify-center');
      const lastQuery = sessionStorage.getItem('lastSearchQuery');
      if (lastQuery) {
        promptInput.value = lastQuery;
      }
    }
    displayMovies(movies);
  }
});

const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

themeSwitcher.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  if (document.documentElement.classList.contains('dark')) {
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.setItem('theme', 'light');
  }
});

document.querySelectorAll('.suggestion').forEach((bubble) => {
  bubble.addEventListener('click', () => {
    promptInput.value = bubble.textContent.trim();
  });
});

promptForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userPrompt = promptInput.value.trim();
  if (!userPrompt) return;

  // Check if user is authenticated
  const isAuthenticated = checkUserAuthentication();
  if (!isAuthenticated) {
    // Show login message
    movieRecommendations.innerHTML = '';
    movieRecommendations.classList.remove('grid', 'grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3');
    movieRecommendations.classList.add('flex', 'items-center', 'justify-center');
    movieRecommendations.innerHTML = `
      <div class="text-center p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md">
        <h3 class="text-xl font-bold mb-3">Log in to continue</h3>
        <p class="mb-4">You need to login in or register an account to get movie recommendations.</p>
      </div>
    `;
    return;
  }

  movieRecommendations.innerHTML = '';
  loadingIndicator.classList.remove('hidden');

  const apiUrl = `${config.apiBaseUrl}/FilmRecomendations/GetFilmRecommendation?prompt=${encodeURIComponent(userPrompt)}`;

  try {
    const response = await fetch(apiUrl, withAuth());
    if (!response.ok) {
      console.error('Error fetching film recommendations:', response.statusText);
      return;
    }
    const movies = await response.json();
    sessionStorage.setItem('lastSearchQuery', userPrompt);
    sessionStorage.setItem('movieRecommendations', JSON.stringify(movies));

    if (movies.length === 0) {
      movieRecommendations.classList.remove('grid', 'grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3');
      movieRecommendations.classList.add('flex', 'items-center', 'justify-center');
      movieRecommendations.innerHTML = '<div class="text-center p-4">Hoppsan, ingen rekommendation kunde göras...vänligen prova en annan sökning.</div>';
      return;
    }

    console.log('Movies:', movies);
    displayMovies(movies);
  } catch (error) {
    console.error('Error fetching film recommendations:', error);
  } finally {
    loadingIndicator.classList.add('hidden');
  }
});

// FIXED: Changed movie card creation to remove transparency issues and hover effects
function displayMovies(movies) {
  const movieContainer = document.getElementById('movieRecommendations');
  
  // Set up container classes for grid layout
  movieContainer.classList.remove('flex', 'items-center', 'justify-center');
  movieContainer.classList.add('grid', 'grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3');
  
  // Fade out current content if any exists
  if (movieContainer.children.length > 0) {
    movieContainer.style.opacity = '0';
    movieContainer.style.transition = 'opacity 0.3s ease-out';
    
    setTimeout(() => {
      movieContainer.innerHTML = '';
      addMovieCards(movies, movieContainer);
    }, 300);
  } else {
    addMovieCards(movies, movieContainer);
  }
}

function addMovieCards(movies, container) {
  movies.forEach((movie) => {
    // Create the card container with modified classes to remove transparency and scale effects
    const movieCard = document.createElement('div');
    movieCard.classList.add(
      'movie-card',
      'bg-white',
      'dark:bg-gray-700',
      'rounded-lg',
      'overflow-hidden',
      'shadow-lg',
      'transition',
      'duration-300',
      'opacity-0',
      'cursor-pointer'
    );

    const posterImg = document.createElement('img');
    posterImg.src = movie.poster_path;
    posterImg.alt = movie.movie_name;
    posterImg.classList.add('w-full', 'md:h-64', 'object-cover');

    const titleDiv = document.createElement('div');
    titleDiv.classList.add('p-4');

    const releaseYearText = document.createElement('h5');
    releaseYearText.classList.add('text-l', 'font-semibold');
    releaseYearText.textContent = `(${movie.release_year})`;

    const titleText = document.createElement('h2');
    titleText.classList.add('text-lg', 'font-semibold');
    titleText.textContent = movie.movie_name;

    titleDiv.appendChild(titleText);
    titleDiv.appendChild(releaseYearText);
    movieCard.appendChild(posterImg);
    movieCard.appendChild(titleDiv);

    movieCard.addEventListener('click', () => showMovieDetails(movie));

    container.appendChild(movieCard);

    requestAnimationFrame(() => {
      movieCard.classList.remove('opacity-0');
      movieCard.classList.add('opacity-100');
    });
  });
  
  // Fade in the container with new content
  container.style.opacity = '1';
  container.style.transition = 'opacity 0.3s ease-in';
}

function showMovieDetails(movie) {
  sessionStorage.setItem('selectedMovie', JSON.stringify(movie));
  const movieSlug = movie.movie_name.toLowerCase().replace(/\s+/g, '-');
  window.location.href = `movie-details.html?movie=${movieSlug}`;
}

let lastSearchQuery = sessionStorage.getItem('lastSearchQuery') || '';
promptInput.addEventListener('input', () => {
  const currentQuery = promptInput.value.trim();
  if (currentQuery !== lastSearchQuery) {
    movieRecommendations.innerHTML = '';
    lastSearchQuery = currentQuery;
  }
});

// Clear search results with fade effect
export function clearSearchResults() {
  const movieContainer = document.getElementById('movieRecommendations');
  if (movieContainer && movieContainer.children.length > 0) {
    // Fade out existing results
    movieContainer.style.transition = 'opacity 0.5s ease-out';
    movieContainer.style.opacity = '0';
    
    setTimeout(() => {
      movieContainer.innerHTML = '';
      movieContainer.classList.remove('grid', 'grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3');
      movieContainer.classList.add('flex', 'items-center', 'justify-center');
      movieContainer.style.opacity = '1';
    }, 500);
  }
}

function checkUserAuthentication() {
  // Use the isAuthenticated helper from auth-utils instead
  return isAuthenticated();
}

