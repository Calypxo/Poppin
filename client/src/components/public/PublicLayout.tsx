import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";
import { LoadingState } from "../ui/States";

export default function PublicLayout() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Wait for the outlet to mount before following links to homepage sections.
      const frame = requestAnimationFrame(() =>
        document.getElementById(hash.slice(1))?.scrollIntoView(),
      );
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);

  return (
    <div className="poppin-public">
      <PublicHeader />
      <div id="public-content" tabIndex={-1}>
        <Suspense
          fallback={
            <main className="poppin-page">
              <LoadingState label="Gathering your local plans…" />
            </main>
          }
        >
          <Outlet />
        </Suspense>
      </div>
      <PublicFooter />
    </div>
  );
}
