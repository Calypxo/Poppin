import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Asterisk,
  Compass,
  MapPin,
  Search,
  Ticket,
} from "lucide-react";
import useHomeEvents from "../../hooks/useHomeEvents";
import {
  ActionLink,
  DecorativeMarquee,
  Reveal,
  SectionHeading,
} from "../../components/public/PublicPrimitives";
import {
  EditorialEventCard,
  EventLoading,
  EventMessage,
  HeroPosterCollage,
} from "../../components/home/EventPresentation";
import WeekendEdit from "../../components/home/WeekendEdit";
import { useAuth } from "../../auth/context";
import Button from "../../components/ui/Button";
import TextReveal from "../../components/ui/TextReveal";
import useSurfaceMotion from "../../hooks/useSurfaceMotion";
import { LocalFindsIllustrations, WatercolorSticker } from "../../components/public/MarketDecorations";
import MarketStillLife from "../../components/public/MarketStillLife";
import OrganizerHighlights from "../../components/social/OrganizerHighlights";

// Group catalog aliases for browsing while preserving the original event categories.
const categoryGroups = [
  { id: "markets", label: "Markets", matches: /market|bazaar/i },
  { id: "food", label: "Food & drinks", matches: /food|drink|coffee|matcha|dessert|pastr/i },
  { id: "fashion", label: "Fashion & thrift", matches: /fashion|thrift|accessor|clothing/i },
  { id: "community", label: "Community", matches: /community|organization/i },
  { id: "creative", label: "Art & crafts", matches: /art|craft|creative|workshop/i },
  { id: "more", label: "More finds", matches: /./ },
];
const categoryGroup = (name: string) => categoryGroups.find(group => group.matches.test(name))?.id || "more";

export default function HomePage() {
  const { events, featured, categories, retry } = useHomeEvents();
  const { user } = useAuth();
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { hash, key } = useLocation();
  const aligned = useRef("");
  const exploreMotion = useSurfaceMotion<HTMLAnchorElement>();
  const vendorMotion = useSurfaceMotion<HTMLAnchorElement>();
  useEffect(() => {
    if (
      !hash ||
      events.loading ||
      categories.loading ||
      aligned.current === key
    )
      return;
    let active = true;
    void document.fonts.ready.then(() => {
      if (active) {
        document
          .getElementById(hash.slice(1))
          ?.scrollIntoView({ behavior: "instant" });
        aligned.current = key;
      }
    });
    return () => {
      active = false;
    };
  }, [hash, key, events.loading, categories.loading]);
  const upcoming = events.data.filter(
    (event) =>
      event.eventState === "upcoming" || event.eventState === "ongoing",
  );
  const posterEvents = [
    ...upcoming,
    ...events.data.filter(
      (event) => !upcoming.some((item) => item._id === event._id),
    ),
  ];
  const ordered = [
    ...featured.data,
    ...events.data.filter(
      (event) => !featured.data.some((item) => item._id === event._id),
    ),
  ];
  const displayed = (
    category
      ? events.data.filter((event) =>
          event.categories?.some((item) => categoryGroup(item.name) === category),
        )
      : ordered
  ).slice(0, 6);
  const availableGroups = categoryGroups.filter(group =>
    categories.data.some(item => categoryGroup(item.name) === group.id)
    || events.data.some(event => event.categories?.some(item => categoryGroup(item.name) === group.id)),
  );
  const cities = new Set(
    events.data.map((event) => event.venue?.city).filter(Boolean),
  );
  return (
    <main className="modern-home">
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="poppin-container hero-layout">
          <div className="hero-copy">
            <span className="hero-kicker">
              <span />
              YOUR FIELD GUIDE TO PAMPANGA
            </span>
            <h1 id="hero-title">
              <TextReveal text="Good plans." />
              <br />
              <span className="hero-highlight"><TextReveal text="Great finds." delay={110} /></span>
              <br />
              <TextReveal text="Right here" delay={220} /><span className="hero-period">.</span>
            </h1>
            <p>
              A market to wander. A maker to meet. A little something worth
              going out for. Find your next local favorite.
            </p>
            <div className="hero-actions">
              <ActionLink to="/discover">Find your next plan</ActionLink>
              <a href="#this-week" className="hero-calendar-link">
                <Ticket size={18} aria-hidden="true" /> The weekend edit
              </a>
            </div>
            <form
              className="hero-search"
              onSubmit={(event) => {
                event.preventDefault();
                navigate(
                  `/discover${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`,
                );
              }}
              role="search"
            >
              <Search size={20} aria-hidden="true" />
              <label htmlFor="home-search" className="sr-only">
                Search local events
              </label>
              <input
                id="home-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search markets, makers & more"
              />
              <Button type="submit" variant="ghost" aria-label="Search events">
                <ArrowUpRight size={21} aria-hidden="true" />
              </Button>
            </form>
            <div className="hero-shortcuts">
              <span>Good things, close to home.</span>
              <Link to="/opportunities">
                Here to sell? <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <HeroPosterCollage
            events={posterEvents}
            loading={events.loading}
            error={events.error}
            retry={retry}
          />
        </div>
        <div className="hero-facts poppin-container">
          <span>
            <MapPin size={15} aria-hidden="true" /> Rooted in Pampanga
          </span>
          <span>
            <Ticket size={15} aria-hidden="true" />{" "}
            {events.loading || events.error
              ? "Events with local character"
              : `${events.data.length} events to explore`}
          </span>
          <span>
            <Compass size={15} aria-hidden="true" />{" "}
            {events.loading || events.error
              ? "Discover your local scene"
              : `${cities.size} ${cities.size === 1 ? "city" : "cities"}. Endless possibilities.`}
          </span>
          <span className="hero-facts-end">
            Find your people. Make a plan.{" "}
            <Asterisk size={18} aria-hidden="true" />
          </span>
        </div>
      </section>
      <DecorativeMarquee />
      <section
        className="home-events poppin-container"
        id="events"
        aria-labelledby="home-events-title"
      >
        <Reveal>
          <div className="home-section-top">
            <SectionHeading eyebrow="01 / THE LOCAL LINEUP">
              <span id="home-events-title">Worth stepping out for.</span>
            </SectionHeading>
            <ActionLink to="/discover" text>
              Explore all events
            </ActionLink>
          </div>
          <div
            className="home-category-list"
            role="group"
            aria-label="Filter events by category"
          >
            <button
              type="button"
              aria-pressed={!category}
              onClick={() => setCategory("")}
            >
              All events
            </button>
            {availableGroups.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={category === item.id}
                onClick={() => setCategory(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {categories.error && (
            <p className="category-load-error">
              Categories couldn't load.{" "}
              <button onClick={retry}>Try again</button>
            </p>
          )}
        </Reveal>
        {!events.loading && !events.error && <p className="sr-only" role="status">
          {displayed.length} events shown{category ? ` in ${categoryGroups.find(group => group.id === category)?.label}` : ""}.
        </p>}
        {events.loading || featured.loading ? (
          <EventLoading />
        ) : (category ? events.error : events.error && featured.error) ? (
          <EventMessage error retry={retry} />
        ) : displayed.length ? (
          <div className="poppin-discover-grid home-event-grid">
            {displayed.map((event) => (
              <Reveal key={event._id}>
                <EditorialEventCard event={event} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EventMessage
            title="Nothing in this category just yet."
            copy="Try another category, or see what else is happening around Pampanga."
          />
        )}
      </section>
      <OrganizerHighlights events={events.data} home />
      <WeekendEdit events={events.data} loading={events.loading} error={events.error} retry={retry} />
      <section className="home-community poppin-container">
        <Reveal>
          <div className="community-intro">
            <span className="poppin-eyebrow">03 / FIND YOUR PLACE</span>
            <h2>
              Come for the finds.
              <br />
              Stay for the <span>feeling.</span>
            </h2>
            <p>
              Your favorite coffee. A one-of-a-kind piece. A familiar face in a
              new place. Good things happen when we show up for local.
            </p>
          </div>
          <div className="community-grid">
            <Link to="/discover" className="community-card community-explore interactive-surface" {...exploreMotion}>
              <span className="community-number">01 / EXPLORE</span>
              <h3>
                Find your
                <br />
                next favorite.
              </h3>
              <p>
                Around the corner or across the city. Follow your curiosity.
              </p>
              <LocalFindsIllustrations />
              <span className="community-card-action">
                Discover events <ArrowUpRight size={25} aria-hidden="true" />
              </span>
            </Link>
            <Link to="/opportunities" className="community-card community-sell interactive-surface" {...vendorMotion}>
              <span className="community-number">02 / SET UP SHOP</span>
              <h3>
                Small business.
                <br />
                Big energy.
              </h3>
              <p>
                Bring what you make, find your crowd, and make it a market day.
              </p>
              <MarketStillLife />
              <span className="community-card-action">
                Find a vendor spot <ArrowUpRight size={25} aria-hidden="true" />
              </span>
            </Link>
          </div>
        </Reveal>
      </section>
      <section className="home-organize">
        <div className="poppin-container">
          <Reveal className="organize-layout">
            <div>
              <span className="poppin-eyebrow">
                FOR THE PEOPLE WHO MAKE IT HAPPEN
              </span>
              <h2>
                Got an idea?
                <br />
                Make it <span>popp.</span>
              </h2>
              <p>
                Bring your community together. Create an event, share your
                updates, and find the vendors who make it yours.
              </p>
              <ActionLink to={user ? "/organizer/profile/edit" : "/register"}>
                Start something local
              </ActionLink>
            </div>
            <div className="organize-art" aria-hidden="true">
              <div className="organize-circle">
                <WatercolorSticker motif="flower-bouquet" />
              </div>
              <div className="organize-ticket">
                <span>THE NEXT BIG THING</span>
                <strong>
                  could be
                  <br />
                  your thing.
                </strong>
                <div className="ticket-barcode" />
                <span>POPP'IN · PAMPANGA</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
