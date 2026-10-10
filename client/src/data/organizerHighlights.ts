export interface OrganizerHighlight {
  id: string;
  organizer: string;
  title: string;
  description: string;
  location: string;
  image: string;
  imageAlt: string;
  kind: "Market moment" | "Organizer poster";
  eventTitles: string[];
  source?: { label: string; url: string };
}

// Editorial highlights, separate from live organizer posts and event dates.
// The existing posters are supplied project assets; do not infer missing years.
export const organizerHighlights: OrganizerHighlight[] = [
  {
    id: "kulitan-youthfest",
    organizer: "Kulitan Flea Market",
    title: "Angeles City Youthfest",
    description: "Kulitan brings its flea market to Angeles City Youthfest on Nepomuceno Street, in front of Holy Rosary Parish.",
    location: "Angeles City, Pampanga",
    image: "/event-gallery/kulitan-youthfest.jpg",
    imageAlt: "Kulitan Flea Market poster for Angeles City Youthfest, October 9–12, 2026, on Nepomuceno Street",
    kind: "Organizer poster",
    eventTitles: ["Kulitan Flea Market: Angeles City Youthfest"],
  },
  {
    id: "flea-club-masquerade",
    organizer: "The Flea Club",
    title: "Masquerade of Smiles",
    description: "The Masquerade of Smiles poster celebrates color, culture and community at Orchard Community Place.",
    location: "San Fernando, Pampanga",
    image: "/event-gallery/masquerade-of-smiles.jpg",
    imageAlt: "The Flea Club Masquerade of Smiles poster, with colorful masks and an October 16–18 market announcement",
    kind: "Organizer poster",
    eventTitles: ["Masquerade of Smiles"],
  },
  {
    id: "snatch-club-matcha",
    organizer: "The Snatch Club",
    title: "The Matcha Club",
    description: "The Matcha Club poster brings coffee, matcha and local finds to the Atrium at SM City Telabastagan.",
    location: "San Fernando, Pampanga",
    image: "/event-gallery/the-matcha-club.jpg",
    imageAlt: "The Matcha Club event poster from The Snatch Club at the Atrium, SM City Telabastagan",
    kind: "Organizer poster",
    eventTitles: ["The Matcha Club"],
  },
];
