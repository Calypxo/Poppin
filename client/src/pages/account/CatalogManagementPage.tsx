import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { Input, Select, Textarea } from "../../components/ui/FormControls";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import api from "../../api/client";
import { useAuth } from "../../auth/context";
import FormField from "../../components/forms/FormField";
import {
  categorySchema,
  venueSchema,
  venueTypes,
  type CategoryFormData,
  type VenueFormData,
} from "../../schemas/managementSchema";
import type { Category, Venue } from "../../types/event";
import { PageHeader } from "../../components/layout/Page";
import { EmptyState, LoadingState } from "../../components/ui/States";
import { useUI } from "../../components/ui/context";
import Tabs from "../../components/ui/Tabs";
import { MapPin, Tags } from "lucide-react";

const blankVenue: VenueFormData = {
  name: "",
  address: "",
  city: "",
  province: "Pampanga",
  venueType: "",
  description: "",
};
const blankCategory: CategoryFormData = { name: "", description: "" };
function fetchManagement(signal?: AbortSignal) {
  return Promise.all([
    api.get<Venue[]>("/venues", { signal }),
    api.get<Category[]>("/categories", { signal }),
  ]);
}
function errorMessage(error: unknown) {
  return axios.isAxiosError(error)
    ? error.response?.data?.message ||
        "Unable to save changes. Please try again."
    : "Unable to save changes. Please try again.";
}

export default function CatalogManagementPage() {
  const { confirm, toast } = useUI();
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [editingVenueId, setEditingVenueId] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [catalog, setCatalog] = useState("venues");
  const venueForm = useForm<VenueFormData>({
    resolver: zodResolver(venueSchema),
    defaultValues: blankVenue,
  });
  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: blankCategory,
  });

  useEffect(() => {
    const controller = new AbortController();
    fetchManagement(controller.signal)
      .then(([venueResponse, categoryResponse]) => {
        setVenues(venueResponse.data);
        setCategories(categoryResponse.data);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Unable to load venues and categories.");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  async function reload() {
    const [venueResponse, categoryResponse] = await fetchManagement();
    setVenues(venueResponse.data);
    setCategories(categoryResponse.data);
    setError("");
  }
  function resetVenue() {
    setEditingVenueId("");
    venueForm.reset(blankVenue);
  }
  function resetCategory() {
    setEditingCategoryId("");
    categoryForm.reset(blankCategory);
  }
  async function saveVenue(data: VenueFormData) {
    setMessage("");
    setActionError("");
    try {
      if (editingVenueId) await api.patch(`/venues/${editingVenueId}`, data);
      else await api.post("/venues", data);
      setMessage(
        editingVenueId
          ? "Venue updated successfully."
          : "Venue created successfully.",
      );
      resetVenue();
      toast.success(
        editingVenueId ? "Venue updated." : "Venue added to your event notes.",
      );
      await reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }
  async function saveCategory(data: CategoryFormData) {
    setMessage("");
    setActionError("");
    try {
      if (editingCategoryId)
        await api.patch(`/categories/${editingCategoryId}`, data);
      else await api.post("/categories", data);
      setMessage(
        editingCategoryId
          ? "Category updated successfully."
          : "Category created successfully.",
      );
      resetCategory();
      toast.success(
        editingCategoryId ? "Category updated." : "Category added.",
      );
      await reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }
  async function removeRecord(
    kind: "venues" | "categories",
    item: { _id: string; name: string },
  ) {
    if (
      !(await confirm({
        title: `Delete ${item.name}?`,
        description:
          "This permanently removes the record. Records used by events or business profiles cannot be deleted.",
        confirmLabel: "Delete record",
        cancelLabel: "Keep record",
      }))
    )
      return;
    setMessage("");
    setActionError("");
    setDeletingId(item._id);
    try {
      await api.delete(`/${kind}/${item._id}`);
      if (editingVenueId === item._id) resetVenue();
      if (editingCategoryId === item._id) resetCategory();
      setMessage("Record deleted successfully.");
      toast.success("Record deleted.");
      await reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setDeletingId("");
    }
  }

  if (loading)
    return (
      <main className="poppin-page">
        <LoadingState label="Gathering your market details…" />
      </main>
    );
  if (error)
    return (
      <main className="poppin-page">
        <h1>Manage market details</h1>
        <p role="alert">{error}</p>
        <Button
          onClick={() =>
            reload().catch(() =>
              setError("Unable to load venues and categories."),
            )
          }
        >
          Try again
        </Button>
      </main>
    );

  return (
    <main className="poppin-page">
      <Link to="/my-events">← Back to my events</Link>
      <PageHeader
        eyebrow="THE BUILDING BLOCKS"
        title="Venues & categories"
        description="Great locations and the right categories help people find your next event."
        motif="map-pin"
      />
      {message && <Alert variant="success">{message}</Alert>}
      {actionError && <Alert variant="error">{actionError}</Alert>}
      <Tabs
        label="Event resources"
        value={catalog}
        onChange={setCatalog}
        items={[
          { value: "venues", label: `Venues (${venues.length})` },
          { value: "categories", label: `Categories (${categories.length})` },
        ]}
      >
        {catalog === "venues" ? (
          <section className="poppin-management-section">
            <h2>
              Venues <span className="poppin-count">{venues.length}</span>
            </h2>
            <div className="poppin-management-grid poppin-catalog-grid">
              <form
                className="poppin-editor-form"
                noValidate
                onSubmit={venueForm.handleSubmit(saveVenue)}
              >
                <h3>{editingVenueId ? "Edit venue" : "Add a venue"}</h3>
                <FormField
                  id="venue-name"
                  label="Venue name"
                  required
                  error={venueForm.formState.errors.name?.message}
                >
                  <Input {...venueForm.register("name")} />
                </FormField>
                <FormField
                  id="venue-address"
                  label="Address"
                  required
                  error={venueForm.formState.errors.address?.message}
                >
                  <Input {...venueForm.register("address")} />
                </FormField>
                <div className="poppin-field-pair">
                  <FormField
                    id="venue-city"
                    label="City"
                    required
                    error={venueForm.formState.errors.city?.message}
                  >
                    <Input {...venueForm.register("city")} />
                  </FormField>
                  <FormField
                    id="venue-province"
                    label="Province"
                    required
                    error={venueForm.formState.errors.province?.message}
                  >
                    <Input {...venueForm.register("province")} />
                  </FormField>
                </div>
                <FormField
                  id="venue-type"
                  label="Venue type"
                  required
                  error={venueForm.formState.errors.venueType?.message}
                >
                  <Select {...venueForm.register("venueType")}>
                    <option value="">Choose a venue type</option>
                    {venueTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField
                  id="venue-description"
                  label="Description"
                  error={venueForm.formState.errors.description?.message}
                >
                  <Textarea rows={3} {...venueForm.register("description")} />
                </FormField>
                <div className="poppin-actions">
                  <Button
                    disabled={venueForm.formState.isSubmitting}
                    type="submit"
                  >
                    {venueForm.formState.isSubmitting
                      ? "Saving…"
                      : editingVenueId
                        ? "Save changes"
                        : "Add venue"}
                  </Button>
                  {editingVenueId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetVenue}
                    >
                      Cancel edit
                    </Button>
                  )}
                </div>
              </form>
              <div className="poppin-record-list poppin-catalog-records">
                {venues.length === 0 && (
                  <EmptyState
                    description="No venues yet. Add your first market location."
                    motif="map-pin"
                  />
                )}
                {venues.map((venue) => (
                  <article
                    className="poppin-record-card poppin-catalog-card"
                    key={venue._id}
                  >
                    <span className="poppin-feature-icon">
                      <MapPin size={20} aria-hidden="true" />
                    </span>
                    <h3>{venue.name}</h3>
                    <p>{venue.address}</p>
                    <p>
                      {venue.city}, {venue.province}
                    </p>
                    <span className="poppin-count">{venue.venueType}</span>
                    {venue.description && <p>{venue.description}</p>}
                    {venue.createdBy === user?._id && (
                      <div className="poppin-actions">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingVenueId(venue._id);
                            venueForm.reset({
                              name: venue.name,
                              address: venue.address,
                              city: venue.city,
                              province: venue.province,
                              venueType: venue.venueType,
                              description: venue.description || "",
                            });
                            venueForm.setFocus("name");
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          disabled={!!deletingId}
                          onClick={() => removeRecord("venues", venue)}
                        >
                          {deletingId === venue._id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="poppin-management-section">
            <h2>
              Categories{" "}
              <span className="poppin-count">{categories.length}</span>
            </h2>
            <div className="poppin-management-grid poppin-catalog-grid">
              <form
                className="poppin-editor-form"
                noValidate
                onSubmit={categoryForm.handleSubmit(saveCategory)}
              >
                <h3>
                  {editingCategoryId ? "Edit category" : "Add a category"}
                </h3>
                <FormField
                  id="category-name"
                  label="Category name"
                  required
                  error={categoryForm.formState.errors.name?.message}
                >
                  <Input {...categoryForm.register("name")} />
                </FormField>
                <FormField
                  id="category-description"
                  label="Description"
                  error={categoryForm.formState.errors.description?.message}
                >
                  <Textarea
                    rows={3}
                    {...categoryForm.register("description")}
                  />
                </FormField>
                <div className="poppin-actions">
                  <Button
                    disabled={categoryForm.formState.isSubmitting}
                    type="submit"
                  >
                    {categoryForm.formState.isSubmitting
                      ? "Saving…"
                      : editingCategoryId
                        ? "Save changes"
                        : "Add category"}
                  </Button>
                  {editingCategoryId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetCategory}
                    >
                      Cancel edit
                    </Button>
                  )}
                </div>
              </form>
              <div className="poppin-record-list poppin-catalog-records">
                {categories.length === 0 && (
                  <EmptyState
                    description="No categories yet. Add a category to help people discover events."
                    motif="bilao"
                  />
                )}
                {categories.map((category) => (
                  <article
                    className="poppin-record-card poppin-catalog-card"
                    key={category._id}
                  >
                    <span className="poppin-feature-icon">
                      <Tags size={20} aria-hidden="true" />
                    </span>
                    <h3>{category.name}</h3>
                    <p>{category.description || "No description provided."}</p>
                    {category.createdBy === user?._id && (
                      <div className="poppin-actions">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingCategoryId(category._id);
                            categoryForm.reset({
                              name: category.name,
                              description: category.description || "",
                            });
                            categoryForm.setFocus("name");
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          disabled={!!deletingId}
                          onClick={() => removeRecord("categories", category)}
                        >
                          {deletingId === category._id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </Tabs>
    </main>
  );
}
