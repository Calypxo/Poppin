import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import api from "../../api/client";
import type { Event } from "../../types/event";
import type {
  VendorCall,
  VendorCallAvailability,
} from "../../types/vendorCall";
import { Reveal } from "../public/PublicPrimitives";
import { WatercolorSticker } from "../public/MarketDecorations";
import { eventDate } from "./eventFormatting";

interface Opportunity {
  call: VendorCall;
  event: Event;
  availability: VendorCallAvailability["availability"];
}

export default function VendorCTA({
  events,
  eventsLoading,
  eventsError,
  retryEvents,
}: {
  events: Event[];
  eventsLoading: boolean;
  eventsError: boolean;
  retryEvents: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [error, setError] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  async function loadOpportunities() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setExpanded(true);
    setLoading(true);
    setError(false);
    setOpportunities([]);
    const publicEvents = events.filter(
      (event) => event.eventState !== "completed",
    );
    const found: Opportunity[] = [];
    let failed = false;
    // Use the existing public endpoint, with bounded concurrency. Availability is server-owned.
    for (
      let index = 0;
      index < publicEvents.length && !controller.signal.aborted;
      index += 4
    ) {
      await Promise.all(
        publicEvents.slice(index, index + 4).map(async (event) => {
          try {
            const { data: call } = await api.get<VendorCall | null>(
              `/vendor-calls/event/${event._id}`,
              { signal: controller.signal },
            );
            if (!call) return;
            const { data } = await api.get<VendorCallAvailability>(
              `/vendor-calls/${call._id}/availability`,
              { signal: controller.signal },
            );
            if (
              call.status === "open" &&
              call.isActive &&
              data.availability.canApply
            )
              found.push({ call, event, availability: data.availability });
          } catch (err) {
            if (
              !axios.isCancel(err) &&
              !(axios.isAxiosError(err) && err.response?.status === 404)
            )
              failed = true;
          }
        }),
      );
    }
    if (controller.signal.aborted) return;
    setOpportunities(
      found.sort(
        (a, b) =>
          new Date(a.call.applicationDeadline).getTime() -
          new Date(b.call.applicationDeadline).getTime(),
      ),
    );
    setError(failed);
    setLoading(false);
  }

  return (
    <section
      id="vendor-opportunities"
      aria-labelledby="vendor-title"
      className="scroll-mt-8 bg-sage py-16 sm:py-24"
    >
      <div className="poppin-container">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_1.7fr]">
          <div className="relative mx-auto w-full max-w-sm">
            <WatercolorSticker
              motif="craft-booth"
              className="h-72 w-full sm:h-80"
            />
            <span aria-hidden="true" className="poppin-vendor-tag">
              A SPACE FOR
              <br />
              YOUR SMALL BRAND
            </span>
          </div>
          <Reveal>
            <p className="poppin-eyebrow mb-4 text-ink">
              CALLING LOCAL MAKERS & LITTLE BUSINESSES
            </p>
            <h2 id="vendor-title" className="poppin-heading text-ink">
              Got something
              <br />
              <em className="text-ink">to sell?</em>
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-ink/75">
              Find markets looking for local vendors and bring your brand to the
              next Popp’in event.
            </p>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls="vendor-results"
              className="poppin-button mt-7"
              disabled={eventsLoading || loading || eventsError}
              onClick={() => void loadOpportunities()}
            >
              See Vendor Opportunities{" "}
              <ArrowUpRight size={17} aria-hidden="true" />
            </button>
            <p className="mt-3 text-xs text-ink/65">
              A little booth. A whole lot of possibility.
            </p>
            {eventsError && (
              <p role="alert" className="mt-4 text-sm text-ink">
                The event noticeboard couldn’t load.{" "}
                <button
                  type="button"
                  className="underline underline-offset-4"
                  onClick={retryEvents}
                >
                  Try loading it again
                </button>{" "}
                to see vendor opportunities.
              </p>
            )}
          </Reveal>
        </div>
        {expanded && (
          <div
            id="vendor-results"
            className="mt-12 border-t border-olive/30 pt-8"
            aria-live="polite"
            aria-busy={loading || eventsLoading}
          >
            <h3 className="font-body text-3xl text-ink">
              Markets looking for you
            </h3>
            {loading || eventsLoading ? (
              <p role="status" className="mt-4 text-sm">
                Checking the market noticeboard…
              </p>
            ) : (
              <>
                {(error || eventsError) && (
                  <div
                    role="alert"
                    className="mt-4 flex flex-wrap items-center gap-4 text-sm"
                  >
                    <p>
                      Some opportunities couldn’t be loaded. Give the
                      noticeboard another try.
                    </p>
                    <button
                      type="button"
                      className="poppin-text-link"
                      onClick={() =>
                        eventsError ? retryEvents() : void loadOpportunities()
                      }
                    >
                      Try again <ArrowUpRight size={16} aria-hidden="true" />
                    </button>
                  </div>
                )}
                {!error && !eventsError && opportunities.length === 0 && (
                  <p className="mt-4 text-sm leading-7">
                    No markets are accepting applications just yet. Check back
                    for a space for your brand.
                  </p>
                )}
                <div className="mt-5 grid gap-x-8 md:grid-cols-2">
                  {opportunities.map(({ call, event, availability }) => (
                    <Link
                      key={call._id}
                      to={`/events/${event._id}`}
                      className="flex items-center justify-between gap-5 border-b border-olive/25 py-5"
                    >
                      <div>
                        <p className="poppin-eyebrow text-ink">
                          {availability.status} · Apply by{" "}
                          {eventDate(call.applicationDeadline)}
                        </p>
                        <h4 className="mt-2 font-body text-2xl">
                          {call.title}
                        </h4>
                        <p className="mt-2 text-xs">
                          {event.title} · {event.venue?.city || "Pampanga"}
                        </p>
                      </div>
                      <ArrowUpRight size={20} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
