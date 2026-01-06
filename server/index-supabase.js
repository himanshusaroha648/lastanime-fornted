import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 4000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set');
  console.error('Please configure these environment variables in Replit Secrets');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

console.log('🚀 Starting AniVerse Supabase API Server...');
console.log(`📡 Supabase URL: ${supabaseUrl}`);

app.get('/', (req, res) => {
  res.json({
    message: '🎬 AniVerse API Server (Supabase)',
    status: 'running',
    database: 'Supabase PostgreSQL',
    endpoints: {
      library: '/api/library',
      series: '/api/series/:slug',
      movies: '/api/movies/:slug',
      episode: '/api/series/:slug/episode/:season-:episode',
      latestEpisodes: '/api/latest-episodes'
    }
  });
});

app.get('/api/library', async (req, res) => {
  try {
    const [seriesResult, moviesResult] = await Promise.all([
      supabase.from('series').select('*').order('title'),
      supabase.from('movies').select('*').order('title')
    ]);

    if (seriesResult.error) throw seriesResult.error;
    if (moviesResult.error) throw moviesResult.error;

    const library = [
      ...(seriesResult.data || []).map(s => ({
        type: 'series',
        slug: s.slug,
        title: s.title,
        poster: s.poster,
        genres: s.genres || [],
        synopsis: s.description || '',
        status: 'Available',
        release_year: s.year,
        totalEpisodes: null,
        rating: s.rating || null
      })),
      ...(moviesResult.data || []).map(m => ({
        type: 'movie',
        slug: m.slug,
        title: m.title,
        poster: m.poster,
        genres: m.genres || [],
        synopsis: m.description || '',
        status: 'Movie',
        release_year: m.year,
        totalEpisodes: 1,
        rating: m.rating || null
      }))
    ];

    res.json(library);
  } catch (error) {
    console.error('Error fetching library:', error);
    res.status(500).json({ error: 'Failed to fetch library' });
  }
});

app.get('/api/series/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const { data: series, error: seriesError } = await supabase
      .from('series')
      .select('*')
      .eq('slug', slug)
      .single();

    if (seriesError || !series) {
      return res.status(404).json({ error: 'Series not found' });
    }

    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('*')
      .eq('series_slug', slug)
      .order('season')
      .order('episode');

    if (episodesError) throw episodesError;

    const seasons = {};
    const episodesBySeason = {};

    (episodes || []).forEach(ep => {
      const seasonKey = String(ep.season);
      
      if (!seasons[seasonKey]) {
        seasons[seasonKey] = [];
        episodesBySeason[seasonKey] = [];
      }

      seasons[seasonKey].push(String(ep.episode));
      episodesBySeason[seasonKey].push({
        id: `${ep.season}-${ep.episode}`,
        number: ep.episode,
        title: ep.title,
        duration: '',
        thumbnail: ep.episode_card_thumbnail || ep.episode_list_thumbnail || ep.thumbnail,
        episode_main_poster: ep.episode_main_poster,
        episode_card_thumbnail: ep.episode_card_thumbnail,
        episode_list_thumbnail: ep.episode_list_thumbnail,
        video_player_thumbnail: ep.video_player_thumbnail,
        description: ''
      });
    });

    const result = {
      type: 'series',
      slug: series.slug,
      title: series.title,
      description: series.description || '',
      poster: series.poster,
      banner_image: series.banner_image,
      genres: series.genres || [],
      status: series.status || 'Available',
      release_year: series.year || series.release_year,
      totalEpisodes: episodes?.length || 0,
      seasons,
      episodes: episodesBySeason,
      rating: series.rating || null
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching series:', error);
    res.status(500).json({ error: 'Failed to fetch series' });
  }
});

app.get('/api/series/:slug/episode/:episodeId', async (req, res) => {
  try {
    const { slug, episodeId } = req.params;
    
    const match = episodeId.match(/(\d+)-(\d+)/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid episode format. Use season-episode (e.g., 1-5)' });
    }

    const [, season, episode] = match;

    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('series_slug', slug)
      .eq('season', parseInt(season))
      .eq('episode', parseInt(episode))
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    const result = {
      series: slug,
      season: data.season,
      episode: data.episode,
      episode_title: data.title,
      title: data.title,
      thumbnail: data.episode_card_thumbnail || data.episode_list_thumbnail || data.thumbnail,
      episode_main_poster: data.episode_main_poster,
      episode_card_thumbnail: data.episode_card_thumbnail,
      episode_list_thumbnail: data.episode_list_thumbnail,
      video_player_thumbnail: data.video_player_thumbnail,
      servers: data.servers || [],
      description: '',
      duration: '',
      releaseDate: '',
      comments: Array.isArray(data.coments) ? data.coments : []
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching episode:', error);
    res.status(500).json({ error: 'Failed to fetch episode' });
  }
});

app.get('/api/movies/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const { data: movie, error } = await supabase
      .from('movies')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const result = {
      type: 'movie',
      slug: movie.slug,
      title: movie.title,
      description: movie.description || '',
      poster: movie.poster,
      banner_image: movie.banner_image,
      movie_poster: movie.poster,
      thumbnail: movie.poster,
      genres: movie.genres || [],
      languages: movie.languages || [],
      status: 'Movie',
      release_year: movie.year || movie.release_year,
      runtime: movie.runtime,
      servers: movie.servers || [],
      rating: movie.rating || null,
      comments: Array.isArray(movie.coments) ? movie.coments : []
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});

app.get('/api/latest-episodes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('latest_episodes')
      .select('*')
      .order('added_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const result = (data || []).map(ep => ({
      seriesSlug: ep.series_slug,
      series: ep.series_title,
      season: ep.season,
      episode: ep.episode,
      title: ep.episode_title,
      thumbnail: ep.thumbnail,
      addedAt: ep.added_at
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching latest episodes:', error);
    res.status(500).json({ error: 'Failed to fetch latest episodes' });
  }
});

// POST endpoint to add comment to episode
app.post('/api/series/:slug/episode/:episodeId/comments', async (req, res) => {
  try {
    const { slug, episodeId } = req.params;
    const { username, text } = req.body;

    if (!username || !text) {
      return res.status(400).json({ error: 'Username and text are required' });
    }

    const match = episodeId.match(/(\d+)-(\d+)/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid episode format' });
    }

    const [, season, episode] = match;

    const { data: episodeData, error: fetchError } = await supabase
      .from('episodes')
      .select('coments')
      .eq('series_slug', slug)
      .eq('season', parseInt(season))
      .eq('episode', parseInt(episode))
      .single();

    if (fetchError || !episodeData) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    const comments = Array.isArray(episodeData.coments) ? episodeData.coments : [];
    const newComment = {
      id: Date.now(),
      username,
      text,
      timestamp: new Date().toISOString()
    };
    comments.push(newComment);

    const { error: updateError } = await supabase
      .from('episodes')
      .update({ coments: comments })
      .eq('series_slug', slug)
      .eq('season', parseInt(season))
      .eq('episode', parseInt(episode));

    if (updateError) throw updateError;

    res.json({ success: true, comment: newComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// POST endpoint to add comment to movie
app.post('/api/movies/:slug/comments', async (req, res) => {
  try {
    const { slug } = req.params;
    const { username, text } = req.body;

    if (!username || !text) {
      return res.status(400).json({ error: 'Username and text are required' });
    }

    const { data: movieData, error: fetchError } = await supabase
      .from('movies')
      .select('coments')
      .eq('slug', slug)
      .single();

    if (fetchError || !movieData) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const comments = Array.isArray(movieData.coments) ? movieData.coments : [];
    const newComment = {
      id: Date.now(),
      username,
      text,
      timestamp: new Date().toISOString()
    };
    comments.push(newComment);

    const { error: updateError } = await supabase
      .from('movies')
      .update({ coments: comments })
      .eq('slug', slug);

    if (updateError) throw updateError;

    res.json({ success: true, comment: newComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Watch History Endpoints
app.post('/api/watch-history', async (req, res) => {
  try {
    const {
      email,
      series_slug,
      movie_slug,
      series_name,
      movie_name,
      season_number,
      episode_number,
      title,
      poster_image,
      data
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const { data: result, error } = await supabase
      .from('watch_history')
      .upsert({
        user_email: email,
        series_slug: series_slug || null,
        series_name: series_name || null,
        movie_slug: movie_slug || null,
        movie_name: movie_name || null,
        season_number: season_number ? String(season_number) : null,
        episode_number: episode_number ? String(episode_number) : null,
        title: title || null,
        poster_image: poster_image || null,
        data: data || {},
        watched_at: new Date().toISOString()
      }, {
        onConflict: 'user_email,series_slug,episode_number,season_number'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error saving watch history:', error);
    res.status(500).json({ error: 'Failed to save watch history' });
  }
});

app.get('/api/watch-history/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { data, error } = await supabase
      .from('watch_history')
      .select('*')
      .eq('user_email', email)
      .order('watched_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching watch history:', error);
    res.status(500).json({ error: 'Failed to fetch watch history' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 API available at http://localhost:${PORT}/api`);
  console.log('📊 Endpoints:');
  console.log('   - GET /api/library');
  console.log('   - GET /api/series/:slug');
  console.log('   - GET /api/series/:slug/episode/:season-:episode');
  console.log('   - GET /api/movies/:slug');
  console.log('   - GET /api/latest-episodes');
});
