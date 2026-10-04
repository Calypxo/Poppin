import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import api from "../../api/client";

import type {
  Category,
  Venue,
} from "../../types/event";

export default function AdminManagementPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");

  // ----------------------------------------------------
  // VENUE FORM
  // ----------------------------------------------------
  const [editingVenueId, setEditingVenueId] = useState("");

  const [venueForm, setVenueForm] = useState({
    name: "",
    address: "",
    city: "",
    province: "Pampanga",
    venueType: "",
    description: "",
  });

  // ----------------------------------------------------
  // CATEGORY FORM
  // ----------------------------------------------------
  const [editingCategoryId, setEditingCategoryId] =
    useState("");

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  // ----------------------------------------------------
  // LOAD DATA
  // ----------------------------------------------------
  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        venueResponse,
        categoryResponse,
      ] = await Promise.all([
        api.get<Venue[]>("/venues"),
        api.get<Category[]>("/categories"),
      ]);

      setVenues(venueResponse.data);
      setCategories(categoryResponse.data);
    } catch (err) {
      console.error(
        "Failed to load admin management data:",
        err
      );

      setError(
        "Unable to load venues and categories."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ----------------------------------------------------
  // SAVE VENUE
  // ----------------------------------------------------
  async function saveVenue(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setMessage("");
    setActionError("");

    if (
      !venueForm.name.trim() ||
      !venueForm.address.trim() ||
      !venueForm.city.trim() ||
      !venueForm.venueType
    ) {
      setActionError(
        "Please complete all required venue fields."
      );

      return;
    }

    try {
      if (editingVenueId) {
        await api.patch(
          `/venues/${editingVenueId}`,
          venueForm
        );

        setMessage(
          "Venue updated successfully."
        );
      } else {
        await api.post(
          "/venues",
          venueForm
        );

        setMessage(
          "Venue added successfully."
        );
      }

      resetVenueForm();

      await loadData();
    } catch (err) {
      console.error(
        "Failed to save venue:",
        err
      );

      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Unable to save venue."
        );
      } else {
        setActionError(
          "Unable to save venue."
        );
      }
    }
  }

  // ----------------------------------------------------
  // EDIT VENUE
  // ----------------------------------------------------
  function editVenue(venue: Venue) {
    setEditingVenueId(venue._id);

    setVenueForm({
      name: venue.name,
      address: venue.address,
      city: venue.city,
      province:
        venue.province || "Pampanga",
      venueType:
        venue.venueType,
      description:
        venue.description || "",
    });

    setMessage("");
    setActionError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ----------------------------------------------------
  // DELETE VENUE
  // ----------------------------------------------------
  async function deleteVenue(
    venue: Venue
  ) {
    const confirmed =
      window.confirm(
        `Delete venue "${venue.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setActionError("");

      await api.delete(
        `/venues/${venue._id}`
      );

      setMessage(
        "Venue deleted successfully."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Failed to delete venue:",
        err
      );

      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Unable to delete venue."
        );
      } else {
        setActionError(
          "Unable to delete venue."
        );
      }
    }
  }

  function resetVenueForm() {
    setEditingVenueId("");

    setVenueForm({
      name: "",
      address: "",
      city: "",
      province: "Pampanga",
      venueType: "",
      description: "",
    });
  }

  // ----------------------------------------------------
  // SAVE CATEGORY
  // ----------------------------------------------------
  async function saveCategory(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setMessage("");
    setActionError("");

    if (!categoryForm.name.trim()) {
      setActionError(
        "Category name is required."
      );

      return;
    }

    try {
      if (editingCategoryId) {
        await api.patch(
          `/categories/${editingCategoryId}`,
          categoryForm
        );

        setMessage(
          "Category updated successfully."
        );
      } else {
        await api.post(
          "/categories",
          categoryForm
        );

        setMessage(
          "Category added successfully."
        );
      }

      resetCategoryForm();

      await loadData();
    } catch (err) {
      console.error(
        "Failed to save category:",
        err
      );

      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Unable to save category."
        );
      } else {
        setActionError(
          "Unable to save category."
        );
      }
    }
  }

  // ----------------------------------------------------
  // EDIT CATEGORY
  // ----------------------------------------------------
  function editCategory(
    category: Category
  ) {
    setEditingCategoryId(
      category._id
    );

    setCategoryForm({
      name: category.name,
      description:
        category.description || "",
    });

    setMessage("");
    setActionError("");
  }

  // ----------------------------------------------------
  // DELETE CATEGORY
  // ----------------------------------------------------
  async function deleteCategory(
    category: Category
  ) {
    const confirmed =
      window.confirm(
        `Delete category "${category.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setActionError("");

      await api.delete(
        `/categories/${category._id}`
      );

      setMessage(
        "Category deleted successfully."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Failed to delete category:",
        err
      );

      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Unable to delete category."
        );
      } else {
        setActionError(
          "Unable to delete category."
        );
      }
    }
  }

  function resetCategoryForm() {
    setEditingCategoryId("");

    setCategoryForm({
      name: "",
      description: "",
    });
  }

  // ----------------------------------------------------
  // LOADING
  // ----------------------------------------------------
  if (loading) {
    return (
      <main style={pageStyle}>
        <p>
          Loading venue and category
          management...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={pageStyle}>
        <h1>
          Venue & Category Management
        </h1>

        <p>{error}</p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <Link to="/admin">
        ← Back to Admin Dashboard
      </Link>

      <header
        style={{
          marginTop: "28px",
        }}
      >
        <h1>
          Venue & Category Management
        </h1>

        <p>
          Manage the venues and event
          categories available in
          Popp'in.
        </p>
      </header>

      {message && (
        <div style={successStyle}>
          {message}
        </div>
      )}

      {actionError && (
        <div style={errorStyle}>
          {actionError}
        </div>
      )}

      {/* ==============================
          VENUES
      ============================== */}

      <section
        style={{
          marginTop: "40px",
        }}
      >
        <h2>Venues</h2>

        <form
          onSubmit={saveVenue}
          style={formStyle}
        >
          <h3>
            {editingVenueId
              ? "Edit Venue"
              : "Add Venue"}
          </h3>

          <label style={labelStyle}>
            Venue Name
          </label>

          <input
            value={venueForm.name}
            onChange={(event) =>
              setVenueForm({
                ...venueForm,
                name:
                  event.target.value,
              })
            }
            style={inputStyle}
          />

          <label style={labelStyle}>
            Address
          </label>

          <input
            value={
              venueForm.address
            }
            onChange={(event) =>
              setVenueForm({
                ...venueForm,
                address:
                  event.target.value,
              })
            }
            style={inputStyle}
          />

          <label style={labelStyle}>
            City
          </label>

          <input
            value={venueForm.city}
            onChange={(event) =>
              setVenueForm({
                ...venueForm,
                city:
                  event.target.value,
              })
            }
            style={inputStyle}
          />

          <label style={labelStyle}>
            Province
          </label>

          <input
            value={
              venueForm.province
            }
            onChange={(event) =>
              setVenueForm({
                ...venueForm,
                province:
                  event.target.value,
              })
            }
            style={inputStyle}
          />

          <label style={labelStyle}>
            Venue Type
          </label>

          <select
            value={
              venueForm.venueType
            }
            onChange={(event) =>
              setVenueForm({
                ...venueForm,
                venueType:
                  event.target.value,
              })
            }
            style={inputStyle}
          >
            <option value="">
              Select venue type
            </option>

            <option value="Mall">
              Mall
            </option>

            <option value="Outdoor Market">
              Outdoor Market
            </option>

            <option value="Community Space">
              Community Space
            </option>

            <option value="Park">
              Park
            </option>

            <option value="Cafe">
              Cafe
            </option>

            <option value="Convention Venue">
              Convention Venue
            </option>

            <option value="Lifestyle Center">
              Lifestyle Center
            </option>

            <option value="Other">
              Other
            </option>
          </select>

          <label style={labelStyle}>
            Description
          </label>

          <textarea
            rows={4}
            value={
              venueForm.description
            }
            onChange={(event) =>
              setVenueForm({
                ...venueForm,
                description:
                  event.target.value,
              })
            }
            style={inputStyle}
          />

          <div style={actionStyle}>
            <button type="submit">
              {editingVenueId
                ? "Save Changes"
                : "Add Venue"}
            </button>

            {editingVenueId && (
              <button
                type="button"
                onClick={
                  resetVenueForm
                }
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div
          style={{
            display: "grid",
            gap: "14px",
            marginTop: "24px",
          }}
        >
          {venues.length === 0 ? (
            <p>
              No venues available.
            </p>
          ) : (
            venues.map((venue) => (
              <article
                key={venue._id}
                style={cardStyle}
              >
                <h3>{venue.name}</h3>

                <p>
                  <strong>
                    Address:
                  </strong>{" "}
                  {venue.address}
                </p>

                <p>
                  <strong>
                    Location:
                  </strong>{" "}
                  {venue.city},{" "}
                  {venue.province}
                </p>

                <p>
                  <strong>
                    Type:
                  </strong>{" "}
                  {venue.venueType}
                </p>

                {venue.description && (
                  <p>
                    {
                      venue.description
                    }
                  </p>
                )}

                <div style={actionStyle}>
                  <button
                    type="button"
                    onClick={() =>
                      editVenue(
                        venue
                      )
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteVenue(
                        venue
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* ==============================
          CATEGORIES
      ============================== */}

      <section
        style={{
          marginTop: "60px",
          marginBottom: "80px",
        }}
      >
        <h2>Categories</h2>

        <form
          onSubmit={saveCategory}
          style={formStyle}
        >
          <h3>
            {editingCategoryId
              ? "Edit Category"
              : "Add Category"}
          </h3>

          <label style={labelStyle}>
            Category Name
          </label>

          <input
            value={
              categoryForm.name
            }
            onChange={(event) =>
              setCategoryForm({
                ...categoryForm,
                name:
                  event.target.value,
              })
            }
            style={inputStyle}
          />

          <label style={labelStyle}>
            Description
          </label>

          <textarea
            rows={4}
            value={
              categoryForm.description
            }
            onChange={(event) =>
              setCategoryForm({
                ...categoryForm,
                description:
                  event.target.value,
              })
            }
            style={inputStyle}
          />

          <div style={actionStyle}>
            <button type="submit">
              {editingCategoryId
                ? "Save Changes"
                : "Add Category"}
            </button>

            {editingCategoryId && (
              <button
                type="button"
                onClick={
                  resetCategoryForm
                }
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div
          style={{
            display: "grid",
            gap: "14px",
            marginTop: "24px",
          }}
        >
          {categories.length ===
          0 ? (
            <p>
              No categories available.
            </p>
          ) : (
            categories.map(
              (category) => (
                <article
                  key={
                    category._id
                  }
                  style={cardStyle}
                >
                  <h3>
                    {category.name}
                  </h3>

                  <p>
                    {category.description ||
                      "No description."}
                  </p>

                  <div
                    style={
                      actionStyle
                    }
                  >
                    <button
                      type="button"
                      onClick={() =>
                        editCategory(
                          category
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteCategory(
                          category
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )
            )
          )}
        </div>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "40px 24px",
};

const formStyle: React.CSSProperties = {
  marginTop: "20px",
  padding: "24px",
  background: "white",
  border: "1px solid #ddd",
  borderRadius: "14px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginTop: "16px",
  marginBottom: "7px",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 13px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  background: "white",
};

const cardStyle: React.CSSProperties = {
  padding: "20px",
  background: "white",
  border: "1px solid #ddd",
  borderRadius: "12px",
};

const actionStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const successStyle: React.CSSProperties = {
  marginTop: "24px",
  padding: "14px",
  background: "#f1fff3",
  border: "1px solid #b7d8ba",
  borderRadius: "10px",
};

const errorStyle: React.CSSProperties = {
  marginTop: "24px",
  padding: "14px",
  background: "#fff4f4",
  border: "1px solid #e0b4b4",
  borderRadius: "10px",
};