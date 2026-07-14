import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-page)] text-center">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <p className="text-[var(--text-secondary)]">Page not found</p>
      <Link to="/">
        <Button>Go home</Button>
      </Link>
    </div>
  );
}
