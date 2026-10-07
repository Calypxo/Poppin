import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="poppin-page">
      <h1>404</h1>
      <p>Page not found.</p>

      <Link to="/">Back to Home</Link>
    </main>
  );
}
