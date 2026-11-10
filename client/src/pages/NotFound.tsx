import { ArrowLeft, ListOrdered } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

// Hosting answers this path with HTTP 404 while still serving the app.
const NOT_FOUND_PATH = "/404";

// Render for unknown routes and for items the server confirmed missing (e.g. `/page/:id`).
// The redirect is irreversible: never render while loading, on other errors, or before auth resolves.
export default function NotFound() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.appendChild(robots);

    // Full-page navigation: a client-side route change sends no request, so no 404 status.
    if (window.location.pathname.replace(/\/$/, "") !== NOT_FOUND_PATH) {
      window.location.replace(NOT_FOUND_PATH);
    }

    return () => robots.remove();
  }, []);

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <main className="status-page">
      <section className="status-card" aria-labelledby="not-found-title">
        <span className="status-mark" aria-hidden="true">
          <ListOrdered size={20} />
        </span>
        <div className="eyebrow">Error 404</div>
        <h1 id="not-found-title">Page not found.</h1>
        <p>
          The page you are looking for doesn't exist. It may have been moved or
          deleted.
        </p>
        <button className="primary-button" onClick={handleGoHome}>
          <ArrowLeft size={16} /> Back to the queue
        </button>
      </section>
    </main>
  );
}
