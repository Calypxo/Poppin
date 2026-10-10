import type { User } from "../../types/account";
export const primaryNavigation = [
  { to: "/", label: "Home" },
  { to: "/discover", label: "Discover" },
  { to: "/feed", label: "Updates" },
  { to: "/opportunities", label: "Opportunities" },
];

export function accountNavigation(user: User | null) {
  const links: { to: string; label: string }[] = [];
  if (user) links.push({ to: "/saved-events", label: "Saved Events" });
  if (user?.organizerId) {
    links.push({ to: "/my-events", label: "My events" });
    links.push({ to: "/events/new", label: "Create event" });
  }
  if (user) links.push({ to: "/profile", label: "My profile" });
  else
    links.push(
      { to: "/login", label: "Log in" },
      { to: "/register", label: "Register" },
    );
  return links;
}
