import { Link } from "react-router-dom";
import { ArrowUpRight, Asterisk, MapPin } from "lucide-react";
import { useAuth } from "../../auth/context";

export default function PublicFooter() {
  const { user } = useAuth();
  return (
    <footer className="site-footer">
      <div className="poppin-container">
        <div className="footer-top">
          <div>
            <span className="poppin-eyebrow">
              YOUR NEXT GOOD THING IS LOCAL
            </span>
            <h2>
              Less scrolling.
              <br />
              More <span>showing up.</span>
            </h2>
            <Link className="footer-cta" to="/discover">
              Find your next plan <ArrowUpRight size={24} aria-hidden="true" />
            </Link>
          </div>
          <div className="footer-links">
            <div>
              <h3>Explore</h3>
              <Link to="/discover">Discover events</Link>
              <Link to="/feed">Events & updates</Link>
              <Link to="/opportunities">Vendor opportunities</Link>
            </div>
            <div>
              <h3>Make it happen</h3>
              <Link to={user ? "/profile" : "/register"}>
                {user ? "My profile" : "Join POPP'IN"}
              </Link>
              <Link to={user ? "/organizer/profile/edit" : "/register"}>
                Organize an event
              </Link>
              <Link to="/my-applications">My applications</Link>
            </div>
          </div>
        </div>
        <div className="footer-wordmark" aria-hidden="true">
          popp
          <Asterisk />
          in<span>.</span>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} POPP'IN</span>
          <span>
            <MapPin size={13} aria-hidden="true" /> Made for going out in
            Pampanga.
          </span>
          <a href="#public-content">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
