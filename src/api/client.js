const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const requestCache = new Map();

async function handleResponse(response) {
        if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const message = error?.error || error?.message || 'Request failed';
                throw new Error(message);
        }
        return response.json();
}

async function fetchWithErrorHandling(url) {
        try {
                const response = await fetch(url);
                return handleResponse(response);
        } catch (error) {
                if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
                        console.error('❌ Backend server not reachable');
                        throw new Error('Cannot connect to backend server');
                }
                throw error;
        }
}

// Deduplicate simultaneous requests to the same URL
function deduplicatedFetch(url) {
        if (requestCache.has(url)) {
                return requestCache.get(url);
        }
        
        const promise = fetchWithErrorHandling(url).finally(() => {
                requestCache.delete(url);
        });
        
        requestCache.set(url, promise);
        return promise;
}

export async function fetchLibrary() {
        return deduplicatedFetch(`${BASE_URL}/library`);
}

export async function fetchSeriesMetadata(slug) {
        return deduplicatedFetch(`${BASE_URL}/series/${encodeURIComponent(slug)}`);
}

export async function fetchMovieMetadata(slug) {
        return deduplicatedFetch(`${BASE_URL}/movies/${encodeURIComponent(slug)}`);
}

export async function fetchEpisode(slug, season, episode) {
        return deduplicatedFetch(
                `${BASE_URL}/series/${encodeURIComponent(slug)}/episode/${season}-${episode}`
        );
}

export async function fetchLatestEpisodes() {
        return deduplicatedFetch(`${BASE_URL}/latest-episodes`);
}

export async function addEpisodeComment(slug, season, episode, username, text) {
        const response = await fetch(
                `${BASE_URL}/series/${encodeURIComponent(slug)}/episode/${season}-${episode}/comments`,
                {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, text })
                }
        );
        return handleResponse(response);
}

export async function addMovieComment(slug, username, text) {
        const response = await fetch(
                `${BASE_URL}/movies/${encodeURIComponent(slug)}/comments`,
                {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, text })
                }
        );
        return handleResponse(response);
}
