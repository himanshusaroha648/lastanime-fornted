import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { fetchMovieMetadata, addMovieComment } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../hooks/useFavorites.js';
import SkeletonCard from '../components/SkeletonCard.jsx';
import PlayerModal from '../components/PlayerModal.jsx';
import StoredComments from '../components/StoredComments.jsx';

function Movie() {
        const { id } = useParams();
        const navigate = useNavigate();
        const { user, authToken, userProfile, loading: authLoading } = useAuth();

        useEffect(() => {
                if (!authLoading && !user) {
                        navigate('/auth');
                }
        }, [user, authLoading, navigate]);

        const { addFavorite, removeFavorite, isFavorited } = useFavorites();
        const [movie, setMovie] = useState(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [playerOpen, setPlayerOpen] = useState(false);
        const [isFav, setIsFav] = useState(false);
        const [comments, setComments] = useState([]);

        useEffect(() => {
                setLoading(true);
                setError(null);
                fetchMovieMetadata(id)
                        .then((payload) => {
                                setMovie(payload);
                                setComments(payload.comments || []);
                        })
                        .catch(() => {
                                setMovie(null);
                                setError('Movie not found');
                                setComments([]);
                        })
                        .finally(() => setLoading(false));
        }, [id]);

        useEffect(() => {
                if (movie && movie.title) {
                        document.title = `${movie.title} · LASTANIME`;
                        setIsFav(isFavorited(id));
                }
        }, [movie, id, isFavorited]);

        const normalizedEpisode = useMemo(() => {
                if (!movie) return null;

                let cleanDescription = movie.description || '';
                cleanDescription = cleanDescription
                        .replace(/Watch.*?(?:on|at)\s+ToonStream[^.!?]*(\.|\!|\?)/gi, '')
                        .replace(/Stream.*?(?:on|at)\s+ToonStream[^.!?]*(\.|\!|\?)/gi, '')
                        .replace(/Available.*?(?:on|at)\s+ToonStream[^.!?]*(\.|\!|\?)/gi, '')
                        .replace(/Download.*?(?:from|on)\s+ToonStream[^.!?]*(\.|\!|\?)/gi, '')
                        .replace(/\bToonStream\b/gi, '')
                        .replace(/\s+/g, ' ')
                        .trim();

                return {
                        title: movie.title,
                        duration: movie.runtime ? `${movie.runtime} min` : '',
                        description: cleanDescription,
                        thumbnail: movie.poster || '/placeholder.jpg',
                        servers: Array.isArray(movie.servers) ? movie.servers : [],
                        releaseDate: movie.release_year ? String(movie.release_year) : ''
                };
        }, [movie]);

        if (loading) {
                return (
                        <section className="mx-auto max-w-5xl px-4 py-16">
                                <div className="grid gap-8 md:grid-cols-[260px,1fr]">
                                        <div className="h-96 rounded-3xl bg-card/50" />
                                        <div className="space-y-4">
                                                <div className="h-10 rounded bg-card/50" />
                                                <div className="glass-surface rounded-3xl p-6">
                                                        <SkeletonCard />
                                                </div>
                                        </div>
                                </div>
                        </section>
                );
        }

        if (error || !movie) {
                return (
                        <section className="py-20 text-center">
                                <h1 className="text-3xl font-semibold text-white">Movie not found</h1>
                                <p className="mt-4 text-muted">
                                        Ensure a <code>movie.json</code> file exists under <code>data/{id}/</code>.
                                </p>
                                <Link
                                        to="/"
                                        className="mt-6 inline-flex rounded-full bg-primary px-4 py-2 text-white transition hover:bg-primary/90"
                                >
                                        Back to home
                                </Link>
                        </section>
                );
        }

        return (
                <>
                        {/* Background Banner Image - Blurred Effect like ToonStream */}
                        {movie.banner_image && (
                                <div className="fixed inset-0 z-0">
                                        <div 
                                                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                                style={{
                                                        backgroundImage: `url(${movie.banner_image})`,
                                                        filter: 'blur(6px)',
                                                        opacity: 0.5,
                                                }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />
                                </div>
                        )}

                        <section className="mx-auto max-w-7xl px-4 py-8 md:py-12 relative z-10">
                                <div className="flex flex-col md:flex-row gap-8">
                                        {/* Left: Poster Image */}
                                        <div className="flex-shrink-0">
                                                <img
                                                        src={movie.poster || '/placeholder.jpg'}
                                                        alt={`${movie.title} poster`}
                                                        className="w-full md:w-64 aspect-[2/3] rounded-2xl object-cover shadow-2xl"
                                                />
                                        </div>

                                        {/* Right: Content */}
                                        <div className="flex-1 space-y-5">


                                                {/* Genres */}
                                                {(movie.genres && movie.genres.length > 0) && (
                                                        <div className="flex flex-wrap gap-1">
                                                                {movie.genres.map((genre, index) => (
                                                                        <span key={genre}>
                                                                                <span className="text-sm text-primary hover:underline cursor-pointer">
                                                                                        {genre}
                                                                                </span>
                                                                                {index < movie.genres.length - 1 && (
                                                                                        <span className="text-muted">, </span>
                                                                                )}
                                                                        </span>
                                                                ))}
                                                        </div>
                                                )}

                                                {/* Description */}
                                                <p className="text-muted/90 leading-relaxed">{normalizedEpisode?.description || 'Description unavailable.'}</p>

                                                {/* Metadata Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-y border-white/10">
                                                        <div>
                                                                <span className="text-primary font-semibold">Release Year:</span>
                                                                <span className="ml-2 text-muted">{movie.release_year || 'N/A'}</span>
                                                        </div>
                                                        {movie.runtime && (
                                                                <div>
                                                                        <span className="text-primary font-semibold">Runtime:</span>
                                                                        <span className="ml-2 text-muted">{movie.runtime} min</span>
                                                                </div>
                                                        )}
                                                        {movie.languages?.length > 0 && (
                                                                <div>
                                                                        <span className="text-primary font-semibold">Languages:</span>
                                                                        <span className="ml-2 text-muted">{movie.languages.join(', ')}</span>
                                                                </div>
                                                        )}
                                                </div>
                                                {/* Play & Favorite Buttons */}
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <button
                                                            type="button"
                                                            onClick={() => {
                                                                    if (!user) {
                                                                            navigate('/auth');
                                                                            return;
                                                                    }
                                                                    setPlayerOpen(true);
                                                            }}
                                                            className="flex-1 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-white transition hover:bg-primary/90 shadow-lg flex items-center justify-center gap-2"
                                                    >
                                                            <span>▶</span> Watch Now
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (!user) {
                                                                navigate('/auth');
                                                                return;
                                                            }
                                                            try {
                                                                if (isFav) {
                                                                    await removeFavorite(id);
                                                                } else {
                                                                    await addFavorite({
                                                                        slug: id,
                                                                        title: movie.title,
                                                                        poster: movie.poster || movie.poster_image || movie.image,
                                                                        type: 'movie'
                                                                    });
                                                                }
                                                            } catch (error) {
                                                                console.error('Error toggling favorite:', error);
                                                            }
                                                        }}
                                                        className={`flex-1 sm:flex-initial rounded-xl px-6 py-4 text-base font-semibold transition flex items-center justify-center gap-2 border shadow-lg ${
                                                            isFav 
                                                            ? 'bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20' 
                                                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                                                        }`}
                                                    >
                                                        <Heart size={20} fill={isFav ? "currentColor" : "none"} />
                                                        {isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                                                    </button>
                                                </div>

                                        </div>
                                </div>
                        </section>

                        <PlayerModal
                                open={playerOpen}
                                onClose={() => setPlayerOpen(false)}
                                episode={normalizedEpisode}
                                onPrev={null}
                                onNext={null}
                                seriesTitle={movie?.title}
                                episodeInfo={{
                                        movieSlug: id,
                                        movieTitle: movie?.title
                                }}
                                moviePoster={movie?.poster_image || movie?.image}
                        />

                        <StoredComments 
                                title={movie?.title}
                                comments={comments}
                                onAddComment={(username, text) => addMovieComment(id, username, text).then((res) => {
                                        setComments([...comments, res.comment]);
                                })}
                                type="movie"
                                user={user ? { ...user, username: userProfile?.username } : null}
                                movieSlug={id}
                        />
                </>
        );
}

export default Movie;

