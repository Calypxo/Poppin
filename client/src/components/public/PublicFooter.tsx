import { Link } from "react-router-dom";
import { WatercolorSticker } from "./MarketDecorations";

import { useAuth } from "../../auth/context";
import { navigation } from "../shared/navigation";
import { ActionLink } from "./PublicPrimitives";
export default function PublicFooter() {
  const { user } = useAuth();
  return (
    <footer className="poppin-footer poppin-scrapbook-footer relative border-t border-pink bg-pink/40 py-12 sm:py-16">
      <div className="poppin-container">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
          <div className="poppin-footer-invitation">
            <p className="poppin-eyebrow mb-3">
              LOCAL FINDS. LOCAL PEOPLE. LOCAL PLACES.
            </p>
            <h2>
              Good finds.
              <br />
              Great weekends.
            </h2>
            <p>A little out of the ordinary. A little closer to home.</p>
            <ActionLink to="/discover" text>
              Find your next local plan
            </ActionLink>
          </div>
          <div className="flex gap-8 sm:pt-2">
            <nav
              aria-label="Footer navigation"
              className="flex flex-col items-start gap-4 text-sm"
            >
              {navigation(user).map((link) => (
                <Link key={link.to} className="poppin-nav-link" to={link.to}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="relative hidden w-24 md:block">
              <WatercolorSticker
                motif="flower-bouquet"
                className="h-28 w-24 -rotate-12"
              />
            </div>
          </div>
        </div>
        <Link
          to="/"
          className="poppin-wordmark poppin-footer-signature"
          aria-label="POPP’IN home"
        >
          POPP’IN
        </Link>
        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-olive/30 pt-6 text-xs sm:flex-row sm:items-center">
          <p className="font-body text-xl italic text-ink">What’s near you?</p>
          <p>Pampanga, Philippines</p>
          <p>© {new Date().getFullYear()} POPP’IN</p>
        </div>
      </div>
    </footer>
  );
}
