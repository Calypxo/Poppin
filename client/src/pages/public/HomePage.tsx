import { categoryIllustration } from "../../components/home/categoryIllustration";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
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
  EventPoster,
  HeroPosterCollage,
} from "../../components/home/EventPresentation";
import WeeklyEventCalendar from "../../components/home/WeeklyEventCalendar";
import VendorCTA from "../../components/home/VendorCTA";
import {
  BotanicalDivider,
  LocalFindsIllustrations,
  LocalFindsShelf,
  WatercolorSticker,
} from "../../components/public/MarketDecorations";

export default function HomePage() {
  const { events, featured, categories, retry } = useHomeEvents();
  const [category, setCategory] = useState("");
  const { hash, key } = useLocation();
  const alignedLocationKey = useRef("");

  useEffect(() => {
    if (!hash) {
      alignedLocationKey.current = "";
      return;
    }
    if (
      events.loading ||
      featured.loading ||
      categories.loading ||
      alignedLocationKey.current === key
    )
      return;
    // Live event sections can change height after the initial route hash jump.
    // Align once their content and the display font have settled.
    let active = true;
    let frame = 0;
    void document.fonts.ready.then(() => {
      if (!active) return;
      frame = requestAnimationFrame(() => {
        const target = document.getElementById(hash.slice(1));
        if (target) {
          target.scrollIntoView({ behavior: "instant" });
          alignedLocationKey.current = key;
        }
      });
    });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [hash, key, events.loading, featured.loading, categories.loading]);

  const upcoming = events.data.filter(
    (event) =>
      event.eventState === "upcoming" || event.eventState === "ongoing",
  );
  const featuredFirst = [
    ...featured.data,
    ...upcoming.filter(
      (event) => !featured.data.some((item) => item._id === event._id),
    ),
  ].sort((a, b) => Number(Boolean(b.posterUrl)) - Number(Boolean(a.posterUrl)));
  const collageEvents = [
    ...upcoming,
    ...events.data.filter(
      (event) => !upcoming.some((item) => item._id === event._id),
    ),
  ];
  const selectedCategory = categories.data.find(
    (item) => item._id === category,
  );
  const displayedEvents = (
    category
      ? events.data.filter((event) =>
          event.categories?.some((item) => item._id === category),
        )
      : featuredFirst
  ).slice(0, 5);
  const bannerEvent = collageEvents.find((event) => event.posterUrl);
  const selectionLoading = category
    ? events.loading
    : featured.loading || events.loading;
  const selectionError = category
    ? events.error
    : featured.error && events.error;

  return (
    <main className="poppin-home poppin-reference-home">
      <section
        aria-labelledby="hero-title"
        className="poppin-hero-scene relative overflow-hidden"
      >
        <div className="poppin-hero-stage grid">
          <div className="poppin-folder relative z-10">
            <div className="poppin-folder-tabs" aria-hidden="true">
              <span>POP-UPS</span>
              <span>BAZAARS</span>
              <span>LOCAL FINDS</span>
            </div>
            <div className="poppin-hero-paper">
              <p className="poppin-hero-eyebrow poppin-eyebrow mb-5 flex items-center gap-3 text-ink">
                <span className="h-px w-7 bg-olive" />
                YOUR PAMPANGA FIELD NOTES
              </p>
              <h1
                id="hero-title"
                className="poppin-hero-title"
                aria-label="What’s Popp’in around Pampanga?"
              >
                <span aria-hidden="true" className="poppin-title-line">
                  What’s
                </span>
                <span aria-hidden="true" className="poppin-title-line">
                  Popp’in
                </span>
                <span
                  aria-hidden="true"
                  className="poppin-title-line poppin-title-accent"
                >
                  around Pampanga?
                </span>
              </h1>
              <p className="poppin-hero-description poppin-entrance mt-6 max-w-sm text-sm leading-7 text-ink/75 sm:text-base">
                Find markets, pop-ups, bazaars and local finds happening near
                you.
              </p>
              <div className="poppin-hero-actions poppin-entrance mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
                <ActionLink to="/discover">
                  <span className="lg:hidden">Find events</span>
                  <span className="hidden lg:inline">Discover events</span>
                </ActionLink>
              </div>
            </div>
          </div>
          <div className="poppin-hero-collage poppin-entrance">
            <HeroPosterCollage
              events={collageEvents}
              loading={events.loading}
              error={events.error}
              retry={retry}
            />
          </div>
        </div>
        <div className="poppin-hero-caption poppin-container flex justify-between gap-4 py-5 text-[10px] uppercase tracking-[0.16em] text-ink">
          <span>Your little guide to going local</span>
          <span>Pampanga, Philippines</span>
        </div>
        <BotanicalDivider />
      </section>
      <DecorativeMarquee />

      <section
        aria-labelledby="weekly-title"
        className="poppin-calendar-section bg-olive py-9 sm:py-12"
      >
        <div className="poppin-container">
          <div className="poppin-week-panel bg-paper px-4 py-6 sm:px-7 sm:py-7">
            <Reveal>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="poppin-eyebrow mb-2 text-ink">
                    A LITTLE SPACE FOR YOUR NEXT GOOD WEEKEND
                  </p>
                  <h2
                    id="weekly-title"
                    className="font-display text-[clamp(1.5rem,2.1vw,2rem)] leading-[1.15] text-ink"
                  >
                    Your local <em>calendar.</em>
                  </h2>
                </div>
                <p className="font-body text-base italic text-ink">
                  Make a little room for going local.
                </p>
              </div>
            </Reveal>
            {events.loading ? (
              <EventLoading compact />
            ) : events.error ? (
              <EventMessage error retry={retry} />
            ) : (
              <WeeklyEventCalendar events={events.data} />
            )}
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-olive/25 pt-4">
              <span className="hidden text-xs italic text-ink sm:block">
                Good weekends start with a little plan.
              </span>
              <ActionLink to="/discover" text>
                Discover All Events
              </ActionLink>
            </div>
          </div>
        </div>
      </section>

      <section className="poppin-container grid items-center gap-8 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="LESS SCROLLING. MORE STROLLING."
            copy="The coffee you’ll come back for. The one-of-a-kind find. The maker you’ll meet along the way. Discover the little things happening around Pampanga."
          >
            Your next local
            <br />
            favorite is probably
            <br />
            <em className="text-ink">popping up nearby.</em>
          </SectionHeading>
          <div className="mt-7">
            <ActionLink to="/discover" text>
              Find Events Near You
            </ActionLink>
          </div>
        </div>
        <div className="poppin-striped-wall relative">
          <LocalFindsIllustrations />
        </div>
        <LocalFindsShelf />
      </section>

      <section
        aria-labelledby="categories-title"
        className="border-y border-olive/20 bg-sage/60 py-12 sm:py-16"
      >
        <div className="poppin-container">
          <Reveal>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="poppin-eyebrow mb-3 text-ink">
                  FOLLOW YOUR KIND OF GOOD TIME
                </p>
                <h2 id="categories-title" className="poppin-heading">
                  What are you <em className="text-ink">into?</em>
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-6 text-ink/75">
                Pick a little interest. Find a little adventure.
              </p>
            </div>
          </Reveal>
          {categories.loading ? (
            <div role="status" className="mt-8 text-sm text-ink">
              Getting the labels ready…
              <div aria-hidden="true" className="mt-4 flex gap-3">
                {["first-category", "second-category", "third-category"].map(
                  (placeholder) => (
                    <div
                      key={placeholder}
                      className="poppin-skeleton h-20 w-32 bg-olive/10"
                    />
                  ),
                )}
              </div>
            </div>
          ) : categories.error ? (
            <EventMessage
              error
              title="The category labels are taking a moment."
              retry={retry}
            />
          ) : categories.data.length ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
              {categories.data.map((item, index) => (
                <button
                  key={item._id}
                  type="button"
                  aria-pressed={category === item._id}
                  className={`poppin-category-ticket poppin-ticket-${index % 3} ${category === item._id ? "is-selected" : ""}`}
                  onClick={() => {
                    setCategory(category === item._id ? "" : item._id);
                    document.getElementById("event-finds")?.scrollIntoView({
                      behavior: window.matchMedia(
                        "(prefers-reduced-motion: reduce)",
                      ).matches
                        ? "instant"
                        : "smooth",
                    });
                  }}
                >
                  <span className="text-[9px] uppercase tracking-[0.2em]">
                    ADMIT ONE CURIOUS LOCAL
                  </span>
                  <WatercolorSticker
                    motif={categoryIllustration(item.name)}
                    className="my-2 h-20 w-24"
                  />
                  <span className="mt-2 font-body text-2xl">{item.name}</span>
                  <span aria-hidden="true" className="mt-2 text-xs">
                    ✳ POP IN & LOOK AROUND ✳
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-sm">
              Fresh interests are coming to the noticeboard soon.
            </p>
          )}
        </div>
      </section>

      <section
        id="event-finds"
        aria-labelledby="featured-title"
        className="poppin-container scroll-mt-8 py-16 sm:py-24"
      >
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <Reveal>
            <p className="poppin-eyebrow mb-4 text-ink">
              A FEW THINGS TO PUT ON YOUR RADAR
            </p>
            <h2 id="featured-title" className="poppin-heading">
              {selectedCategory ? (
                <>
                  {selectedCategory.name}
                  <br />
                  <em className="text-ink">on the noticeboard.</em>
                </>
              ) : (
                <>
                  Worth <em className="text-ink">popping into.</em>
                </>
              )}
            </h2>
          </Reveal>
          {category ? (
            <button
              type="button"
              className="poppin-text-link text-sm"
              onClick={() => setCategory("")}
            >
              Show all local finds ×
            </button>
          ) : (
            <ActionLink to="/discover" text>
              Explore all events
            </ActionLink>
          )}
        </div>
        {!category && featured.error && !events.error && (
          <p role="status" className="mt-5 text-sm text-ink">
            Featured picks couldn’t load; here’s what’s coming up instead.{" "}
            <button
              type="button"
              onClick={retry}
              className="underline underline-offset-4"
            >
              Retry featured picks
            </button>
          </p>
        )}
        {!category && events.error && !featured.error && (
          <p role="status" className="mt-5 text-sm text-ink">
            Upcoming events couldn’t load; you can still explore the featured
            picks.{" "}
            <button
              type="button"
              onClick={retry}
              className="underline underline-offset-4"
            >
              Retry upcoming events
            </button>
          </p>
        )}
        {selectionLoading ? (
          <EventLoading />
        ) : selectionError ? (
          <EventMessage error retry={retry} />
        ) : displayedEvents.length ? (
          <div className="poppin-feature-grid mt-9">
            {displayedEvents.map((event, index) => (
              <EditorialEventCard
                key={event._id}
                event={event}
                large={index === 0}
              />
            ))}
          </div>
        ) : (
          <EventMessage
            title={
              category ? "No events under this label just yet." : undefined
            }
          />
        )}
      </section>

      <section
        aria-labelledby="image-break-title"
        className="poppin-image-break relative overflow-hidden bg-olive text-ink"
      >
        {bannerEvent && (
          <div className="poppin-banner-image absolute inset-y-0 right-0 w-full opacity-25 sm:w-1/2 sm:opacity-60">
            <EventPoster event={bannerEvent} contain />
          </div>
        )}
        <div className="poppin-container relative flex min-h-72 flex-col items-start gap-8 py-12 sm:min-h-80 md:flex-row md:items-center">
          <div className="max-w-xl">
            <p className="poppin-eyebrow mb-4 text-ink">
              KEEP A LITTLE CURIOSITY IN YOUR WEEKEND
            </p>
            <h2
              id="image-break-title"
              className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05]"
            >
              Something new is
              <br />
              always <em>popping up.</em>
            </h2>
            <div className="mt-7">
              <ActionLink to="/discover" light>
                See What’s Happening
              </ActionLink>
            </div>
          </div>
          {!bannerEvent && (
            <WatercolorSticker
              motif="dessert-cups"
              className="mx-auto h-52 w-52 -rotate-6 md:ml-auto md:mr-0 md:h-64 md:w-64 md:shrink-0"
            />
          )}
        </div>
      </section>
      <VendorCTA
        events={events.data}
        eventsLoading={events.loading}
        eventsError={events.error}
        retryEvents={retry}
      />
      <section className="poppin-container flex flex-col items-center gap-4 py-12 text-center sm:py-16">
        <WatercolorSticker
          motif="flower-market-booth"
          className="h-56 w-full max-w-sm sm:h-72 sm:max-w-md"
        />
        <p className="font-body text-2xl italic text-ink sm:text-3xl">
          Made for weekends around Pampanga.
        </p>
        <p className="poppin-eyebrow text-ink/65">
          See you around. See you at the market.
        </p>
      </section>
    </main>
  );
}
