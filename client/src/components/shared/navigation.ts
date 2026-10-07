import type { User } from "../../types/account";
export function navigation(user: User | null) {
  const links = [
    { to: "/", label: "Home" },
    { to: "/discover", label: "Discover" },
    { to: "/feed", label: "Events & updates" },
    { to: "/opportunities", label: "Opportunities" },
  ];
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
