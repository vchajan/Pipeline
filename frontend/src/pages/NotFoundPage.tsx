import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="login-page">
      <h1>Page not found</h1>
      <p>The requested monitoring view does not exist.</p>
      <Link className="primary-button" to="/dashboard">
        Go to dashboard
      </Link>
    </section>
  );
}
