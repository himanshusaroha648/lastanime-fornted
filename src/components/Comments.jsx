import { useEffect, useRef } from 'react';

function Comments({ location, title }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Clear previous Giscus scripts
    if (containerRef.current) {
      const existingIframe = containerRef.current.querySelector('iframe');
      if (existingIframe) {
        existingIframe.remove();
      }
    }

    // Load Giscus script
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    // GitHub repo for comments
    script.setAttribute('data-repo', 'himanshusaroha648/lastanime-comments');
    script.setAttribute('data-repo-id', 'R_kgDOQuPuOw');
    script.setAttribute('data-category', 'Anime Comments');
    script.setAttribute('data-category-id', 'DIC_kwDOQuPuOw4CkhQA');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'dark_high_contrast');
    script.setAttribute('data-lang', 'en');

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      // Cleanup
      const iframe = containerRef.current?.querySelector('iframe');
      if (iframe) {
        iframe.remove();
      }
    };
  }, [location]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 relative z-10">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Comments & Discussion</h2>
        <p className="text-muted">Share your thoughts about {title}</p>
      </div>
      
      <div 
        ref={containerRef} 
        className="glass-surface rounded-2xl p-6 giscus-container"
      >
        <p className="text-muted text-center py-8">Loading comments...</p>
      </div>
    </section>
  );
}

export default Comments;
