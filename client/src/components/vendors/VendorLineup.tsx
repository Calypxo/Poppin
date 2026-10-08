import { useId, useState } from "react";
import { Search, Store, X } from "lucide-react";
import type { VendorLineupItem } from "../../types/vendorApplication";
import VendorCard from "../shared/VendorCard";
import ResourceState from "../shared/ResourceState";

export default function VendorLineup({
  vendors,
  loading,
  error,
  reload,
}: {
  vendors: VendorLineupItem[];
  loading: boolean;
  error: string;
  reload?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const searchId = useId();
  const groups = new Map<string, VendorLineupItem[]>();
  for (const vendor of vendors) {
    const name = vendor.category?.name || "Local businesses";
    groups.set(name, [...(groups.get(name) || []), vendor]);
  }
  const query = search.trim().toLocaleLowerCase();
  const visibleGroups = [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([name, items]) => ({
    name,
    items: category && category !== name ? [] : items.filter((vendor) =>
      `${vendor.businessName} ${vendor.products} ${vendor.description} ${name}`.toLocaleLowerCase().includes(query)),
  })).filter((group) => group.items.length);
  const visibleCount = visibleGroups.reduce((total, group) => total + group.items.length, 0);
  return (
    <section
      className="poppin-vendor-lineup"
      id="vendor-lineup"
      aria-labelledby="vendor-lineup-title"
    >
      <div className="poppin-section-heading">
        <div>
          <p className="poppin-eyebrow">MEET THE VENDORS</p>
          <h2 id="vendor-lineup-title">The people behind the good finds.</h2>
          <p>Discover the businesses confirmed for this event.</p>
        </div>
        {!loading && !error && (
          <span className="poppin-results-count">
            <Store size={16} aria-hidden="true" />
            {vendors.length} {vendors.length === 1 ? "business" : "businesses"}
          </span>
        )}
      </div>
      <ResourceState
        loading={loading}
        error={error}
        reload={reload}
        empty={
          !vendors.length
            ? "The lineup is taking shape. Confirmed businesses will appear here as the organizer accepts applications."
            : ""
        }
      />
      {!loading && !error && vendors.length > 0 && (
        <>
          <div className="lineup-explorer">
            <div className="lineup-search">
              <Search size={19} aria-hidden="true" />
              <label htmlFor={searchId} className="sr-only">Search this vendor lineup</label>
              <input id={searchId} type="search" value={search} onChange={(event) => setSearch(event.target.value)}
                placeholder="Search businesses or products" />
            </div>
            <div className="lineup-categories" role="group" aria-label="Filter vendors by category">
              <button type="button" aria-pressed={!category} onClick={() => setCategory("")}>
                All finds <span>{vendors.length}</span>
              </button>
              {[...groups].sort(([a], [b]) => a.localeCompare(b)).map(([name, items]) => (
                <button key={name} type="button" aria-pressed={category === name} onClick={() => setCategory(name)}>
                  {name} <span>{items.length}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="lineup-results">
            <p role="status" aria-live="polite">{visibleCount} of {vendors.length} businesses{query || category ? " match your filters" : " to discover"}</p>
            {(query || category) && (
              <button type="button" onClick={() => { setSearch(""); setCategory(""); }}>
                Clear filters <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
          {!visibleCount && <p className="lineup-no-results">No finds just yet. Try another name, product or category.</p>}
          <div className="lineup-groups">
            {visibleGroups.map(({ name, items }) => (
              <section className={`lineup-group ${items.length > 2 ? "lineup-group-wide" : ""}`} key={name} aria-label={name}>
                <div className="lineup-group-heading"><h3>{name}</h3><span>{items.length} {items.length === 1 ? "business" : "businesses"}</span></div>
                <div className="poppin-lineup-grid">
                  {items.map((vendor) => <VendorCard key={vendor._id} vendor={vendor} />)}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
