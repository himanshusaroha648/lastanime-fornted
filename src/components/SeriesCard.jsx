import { Link } from 'react-router-dom';

function SeriesCard({ series }) {
  const href = series.type === 'movie' ? `/movie/${series.slug}` : `/series/${series.slug}`;
  
  const genres = Array.isArray(series.genres) 
    ? series.genres 
    : typeof series.genres === 'string' 
      ? series.genres.split(',').map(g => g.trim()).filter(Boolean)
      : [];

  return (
    <Link
      to={href}
      className="card-hover relative block overflow-hidden rounded-lg md:rounded-2xl bg-card p-1 md:p-2 focus-visible:ring-2 focus-visible:ring-primary"
    >
      <img
        src={series.poster || '/placeholder.jpg'}
        alt={`${series.title} artwork`}
        loading="lazy"
        className="w-full aspect-[3/4] rounded-md md:rounded-xl object-cover object-center"
        style={{ imageRendering: 'high-quality' }}
      />
      {series.rating && (
        <div className="absolute top-2 right-2 md:top-3 md:right-3 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5 md:px-2 md:py-1">
          <svg className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-[10px] md:text-xs font-semibold text-white">{series.rating.toFixed(1)}</span>
        </div>
      )}
      <div className="absolute inset-0 rounded-lg md:rounded-2xl bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80" />
      <div className="absolute inset-x-1.5 bottom-1.5 md:inset-x-3 md:bottom-3 z-10">
        <p className="text-[9px] md:text-xs uppercase text-muted truncate">
          {series.type === 'movie' ? 'Movie' : 'Series'}
          {genres.length ? ` · ${genres.slice(0, 1).join(' · ')}` : ''}
        </p>
        <h3 className="mt-0.5 md:mt-1 text-xs md:text-lg font-semibold text-white line-clamp-2">{series.title}</h3>
        {series.updated_at && (
          <p className="text-[8px] md:text-[10px] text-primary/80 font-medium mt-0.5">
            Updated {new Date(series.updated_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </Link>
  );
}

export default SeriesCard;
