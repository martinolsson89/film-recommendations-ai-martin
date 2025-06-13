import config from './config.js';
import { isAuthenticated } from './auth-utils.js';

// Top Picks functionality
let topPicksData = [];
let currentPage = 0;

// Dynamic movies per page based on screen size
function getMoviesPerPage() {
    return window.innerWidth <= 640 ? 1 : 3; // Mobile: 1, Desktop: 3
}

// Handle window resize to adjust layout
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (topPicksData.length > 0) {
            // Reset to first page on resize to avoid pagination issues
            currentPage = 0;
            displayTopPicks();
        }
    }, 250); // Debounce resize events
});

// Initialize Top Picks on page load
export function initializeTopPicks() {
    console.log('Initializing Top Picks...');
    console.log('Is authenticated:', isAuthenticated());
    console.log('Auth token exists:', !!localStorage.getItem('authToken'));
    
    // Only show top picks for authenticated users with liked movies
    if (isAuthenticated()) {
        console.log('User is authenticated, checking for liked movies before showing loading');
        fetchTopPicks(); // This will handle showing loading only if needed
    } else {
        console.log('User not authenticated, hiding top picks');
        hideTopPicksSection();
    }
}

// Show loading skeleton for Top Picks
function showLoadingTopPicks() {
    const section = document.getElementById('topPicksSection');
    const container = document.getElementById('topPicksContainer');
    
    if (section && container) {
        // Update heading to show loading state
        updateHeading('Loading your top picks...');
        
        // Clear any existing content
        container.innerHTML = '';
        
        // Create skeleton cards based on screen size
        const skeletonCount = getMoviesPerPage();
        for (let i = 0; i < skeletonCount; i++) {
            const skeletonCard = createSkeletonCard();
            container.appendChild(skeletonCard);
        }
        
        // Show the section with fade-in
        section.classList.remove('hidden');
        section.style.opacity = '0';
        section.style.transition = 'opacity 0.5s ease-in';
        
        setTimeout(() => {
            section.style.opacity = '1';
        }, 10);
    }
}

// Create a skeleton loading card
function createSkeletonCard() {
    const skeletonCard = document.createElement('div');
    skeletonCard.classList.add('skeleton-card');
    
    const skeletonPoster = document.createElement('div');
    skeletonPoster.classList.add('skeleton-poster');
    
    const skeletonTitle = document.createElement('div');
    skeletonTitle.classList.add('skeleton-title');
    
    const skeletonYear = document.createElement('div');
    skeletonYear.classList.add('skeleton-year');
    
    skeletonCard.appendChild(skeletonPoster);
    skeletonCard.appendChild(skeletonTitle);
    skeletonCard.appendChild(skeletonYear);
    
    return skeletonCard;
}

// Hide top picks section with fade effect
export function hideTopPicksSection() {
    const section = document.getElementById('topPicksSection');
    if (section && !section.classList.contains('hidden')) {
        console.log('Hiding top picks section with fade effect');
        
        // Stop any running slideshow
        stopAutoSlideshow();
        
        // Fade out the section
        section.style.transition = 'opacity 0.5s ease-out';
        section.style.opacity = '0';
        
        // Hide the section after fade completes
        setTimeout(() => {
            section.classList.add('hidden');
            section.style.opacity = ''; // Reset opacity
        }, 500);
    }
}

// Fetch top picks based on user preferences
async function fetchTopPicks() {
    try {
        console.log('Fetching top picks...');
        // First check if user has liked movies
        const likedMovies = await getUserLikedMovies();
        console.log('Liked movies found:', likedMovies.length);
        
        // Only show loading and proceed if user has liked movies
        if (likedMovies && likedMovies.length > 0) {
            console.log('User has liked movies, showing loading state');
            showLoadingTopPicks();
            
            console.log('Getting personalized recommendations based on:', likedMovies.map(m => m.title || m.movie_name));
            const recommendations = await getPersonalizedRecommendations(likedMovies);
            
            if (recommendations && recommendations.length > 0) {
                console.log('Recommendations received:', recommendations.length);
                topPicksData = recommendations;
                updateHeading('Top picks for you');
                displayTopPicks();
                showTopPicksSection();
            } else {
                console.log('No recommendations received, hiding section');
                hideTopPicksSection();
            }
        } else {
            console.log('No liked movies found, hiding top picks section');
            hideTopPicksSection();
        }
        // If no liked movies or no recommendations, don't show the section
    } catch (error) {
        console.error('Error fetching top picks:', error);
        // Don't show anything if there's an error
    }
}

// Update the heading text
function updateHeading(text) {
    const heading = document.querySelector('#topPicksSection h2');
    if (heading) {
        heading.textContent = text;
    }
}

// Get user's liked movies from the API
async function getUserLikedMovies() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return [];

        // Try to get user's movies (including liked ones)
        const response = await fetch(`${config.apiBaseUrl}/api/Movies`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('authToken');
            }
            console.log('API response not OK:', response.status, response.statusText);
            return [];
        }

        const userMovies = await response.json();
        console.log('User movies response:', userMovies);
        console.log('Response type:', typeof userMovies);
        console.log('Response keys:', Object.keys(userMovies || {}));
        
        // Handle paginated API response structure
        let moviesArray = [];
        
        if (Array.isArray(userMovies)) {
            moviesArray = userMovies;
        } else if (userMovies && userMovies.pageItems) {
            console.log('pageItems exists, type:', typeof userMovies.pageItems);
            console.log('pageItems content:', userMovies.pageItems);
            console.log('pageItems is array:', Array.isArray(userMovies.pageItems));
            
            if (Array.isArray(userMovies.pageItems)) {
                moviesArray = userMovies.pageItems;
                console.log('Found pageItems array');
            } else if (userMovies.pageItems.$values && Array.isArray(userMovies.pageItems.$values)) {
                moviesArray = userMovies.pageItems.$values;
                console.log('Found pageItems.$values array');
            } else {
                console.log('pageItems structure not recognized');
            }
        } else if (userMovies && userMovies.data && Array.isArray(userMovies.data)) {
            moviesArray = userMovies.data;
        } else if (userMovies && userMovies.items && Array.isArray(userMovies.items)) {
            moviesArray = userMovies.items;
        } else if (userMovies && userMovies.$values && Array.isArray(userMovies.$values)) {
            moviesArray = userMovies.$values;
        } else if (userMovies && userMovies.movies && Array.isArray(userMovies.movies)) {
            moviesArray = userMovies.movies;
        } else {
            console.log('Could not find movies array in response structure');
            return [];
        }
        
        console.log('Movies array found:', moviesArray.length, 'movies');
        console.log('Sample movie:', moviesArray[0]);
        
        // Filter for liked movies (where liked === true)
        const likedMovies = moviesArray.filter(movie => movie.liked === true);
        console.log('Filtered liked movies:', likedMovies.length);
        
        return likedMovies;
    } catch (error) {
        console.error('Error fetching liked movies:', error);
        return [];
    }
}

// Get personalized recommendations based on liked movies
async function getPersonalizedRecommendations(likedMovies) {
    try {
        // Create a prompt based on the user's liked movies
        const movieTitles = likedMovies.slice(0, 3).map(movie => movie.title).join(', ');
        const prompt = `Movies similar to ${movieTitles}`;
        
        const response = await fetch(`${config.apiBaseUrl}/FilmRecomendations/GetFilmRecommendation?prompt=${encodeURIComponent(prompt)}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get personalized recommendations');
        }

        const recommendations = await response.json();
        return recommendations && recommendations.length > 0 ? recommendations.slice(0, 12) : [];
    } catch (error) {
        console.error('Error getting personalized recommendations:', error);
        return [];
    }
}



// Enhanced display with smooth fade transitions and hover pause
function displayTopPicks() {
    const container = document.getElementById('topPicksContainer');
    const section = document.getElementById('topPicksSection');
    if (!container) return;

    // Update heading to final state
    updateHeading('Top picks for you');

    // Calculate how many pages we need (responsive)
    const moviesPerPage = getMoviesPerPage();
    const totalPages = Math.ceil(topPicksData.length / moviesPerPage);
    
    // Ensure currentPage is within bounds (fix for empty pages)
    if (currentPage >= totalPages) {
        currentPage = 0;
    }
    
    // Create movie cards for current page
    const startIndex = currentPage * moviesPerPage;
    const endIndex = Math.min(startIndex + moviesPerPage, topPicksData.length);
    const currentMovies = topPicksData.slice(startIndex, endIndex);

    // Fade out current content (loading skeleton or previous content)
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.4s ease-in-out';
    
    setTimeout(() => {
        // Clear and rebuild content
        container.innerHTML = '';
        
        currentMovies.forEach((movie) => {
            const movieCard = createTopPicksMovieCard(movie);
            container.appendChild(movieCard);
        });
        
        // Fade in new content with slight delay for smooth transition
        setTimeout(() => {
            container.style.opacity = '1';
        }, 50);
    }, 400);

    // Setup pagination and slideshow only if we have more than one page
    if (totalPages > 1) {
        setupPagination(totalPages);
        startAutoSlideshow(totalPages);
        
        // Add brief hover pause functionality
        if (section) {
            section.addEventListener('mouseenter', () => pauseSlideshowBriefly(totalPages));
            section.addEventListener('mouseleave', () => {
                // Clear any pending pause timeout and restart immediately
                if (hoverPauseTimeout) {
                    clearTimeout(hoverPauseTimeout);
                }
                startAutoSlideshow(totalPages);
            });
        }
    } else {
        // Hide pagination dots when there's only one page
        const paginationContainer = document.getElementById('topPicksPagination');
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
        // Stop any running slideshow
        stopAutoSlideshow();
    }
}

// Auto slideshow functionality with brief hover pause
let slideshowInterval;
let hoverPauseTimeout;

function startAutoSlideshow(totalPages) {
    // Clear existing interval and timeout
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
    }
    if (hoverPauseTimeout) {
        clearTimeout(hoverPauseTimeout);
    }
    
    // Start auto slideshow (change page every 5 seconds)
    slideshowInterval = setInterval(() => {
        currentPage = (currentPage + 1) % totalPages;
        displayTopPicks();
    }, 5000);
}

function pauseSlideshowBriefly(totalPages) {
    // Clear current slideshow
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }
    
    // Clear any existing pause timeout
    if (hoverPauseTimeout) {
        clearTimeout(hoverPauseTimeout);
    }
    
    // Resume slideshow after 2 seconds of no interaction
    hoverPauseTimeout = setTimeout(() => {
        startAutoSlideshow(totalPages);
    }, 2000);
}

function stopAutoSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }
    if (hoverPauseTimeout) {
        clearTimeout(hoverPauseTimeout);
        hoverPauseTimeout = null;
    }
}

// Create a movie card for Top Picks
function createTopPicksMovieCard(movie) {
    const movieCard = document.createElement('div');
    movieCard.classList.add(
        'top-picks-card',
        'bg-white',
        'dark:bg-gray-700',
        'rounded-lg',
        'overflow-hidden',
        'shadow-lg',
        'cursor-pointer'
    );

    const posterImg = document.createElement('img');
    posterImg.src = movie.poster_path;
    posterImg.alt = movie.movie_name;
    posterImg.classList.add('w-full', 'h-72', 'object-cover'); // Desktop: h-72, Mobile will be overridden by CSS

    const titleDiv = document.createElement('div');
    titleDiv.classList.add('p-4'); // Match search results padding

    const titleText = document.createElement('h2');
    titleText.classList.add('text-lg', 'font-semibold', 'text-gray-900', 'dark:text-gray-100'); // Match search results
    titleText.textContent = movie.movie_name;

    const releaseYearText = document.createElement('h5');
    releaseYearText.classList.add('text-l', 'font-semibold'); // Removed default color classes
    releaseYearText.style.color = '#e5e7eb'; // Custom color
    releaseYearText.textContent = `(${movie.release_year})`;

    titleDiv.appendChild(titleText);
    titleDiv.appendChild(releaseYearText);
    movieCard.appendChild(posterImg);
    movieCard.appendChild(titleDiv);

    // Add click handler to navigate to movie details
    movieCard.addEventListener('click', () => showMovieDetails(movie));

    return movieCard;
}

// Setup pagination dots
function setupPagination(totalPages) {
    const paginationContainer = document.getElementById('topPicksPagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('div');
        dot.classList.add('pagination-dot');
        if (i === currentPage) {
            dot.classList.add('active');
        }

        dot.addEventListener('click', () => {
            currentPage = i;
            displayTopPicks();
            // Restart auto slideshow after manual click
            startAutoSlideshow(totalPages);
        });

        paginationContainer.appendChild(dot);
    }
}

// Show the Top Picks section with fade effect (only if not already visible)
function showTopPicksSection() {
    const section = document.getElementById('topPicksSection');
    if (section && section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        section.style.opacity = '0';
        section.style.transition = 'opacity 0.5s ease-in';
        
        // Fade in the section
        setTimeout(() => {
            section.style.opacity = '1';
        }, 10);
    }
}

// Navigate to movie details (reuse existing function from main.js)
function showMovieDetails(movie) {
    sessionStorage.setItem('selectedMovie', JSON.stringify(movie));
    const movieSlug = movie.movie_name.toLowerCase().replace(/\s+/g, '-');
    window.location.href = `movie-details.html?movie=${movieSlug}`;
}

// Export for use in main.js
export { fetchTopPicks, displayTopPicks };
