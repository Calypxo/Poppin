import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  applicationSchema,
  type ApplicationFormData,
} from "../../schemas/applicationSchema";
import { useAuth } from "../../auth/context";
import api from "../../api/client";
import useResource, { errorMessage } from "../../hooks/useResource";
import type { Category } from "../../types/event";
import type {
  VendorCall,
  VendorCallAvailability,
} from "../../types/vendorCall";
import type { VendorApplicationListItem } from "../../types/vendorApplication";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { Input, Select, Textarea } from "../../components/ui/FormControls";
import FormField from "../../components/forms/FormField";
import ResourceState from "../../components/shared/ResourceState";
import { PageHeader } from "../../components/layout/Page";
import { useUI } from "../../components/ui/context";
import { CalendarDays, MapPin, Store, ArrowUpRight } from "lucide-react";

export default function VendorApplicationPage() {
  const { user } = useAuth();
  const { toast } = useUI();
  const { vendorCallId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const call = useResource<VendorCall>(`/vendor-calls/${vendorCallId}`);
  const categories = useResource<Category[]>("/categories");
  const availability = useResource<VendorCallAvailability>(
    `/vendor-calls/${vendorCallId}/availability`,
  );
  const applications = useResource<VendorApplicationListItem[]>(
    call.data ? `/vendor-applications?event=${call.data.event._id}` : null,
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      businessName: "",
      category: "",
      products: "",
      businessDescription: "",
      contactNumber: user?.contactNumber || "",
      email: user?.email || "",
      socialMedia: "",
      notes: "",
    },
  });
  const loading =
    call.loading ||
    categories.loading ||
    availability.loading ||
    applications.loading;
  const loadError =
    call.error || categories.error || availability.error || applications.error;
  const acceptedCategories = call.data?.acceptedCategories || [];
  const options =
    categories.data?.filter(
      (category) =>
        !acceptedCategories.length ||
        acceptedCategories.some((accepted) => accepted._id === category._id),
    ) || [];
  return (
    <main className="poppin-page poppin-editor-page">
      <Link
        to={call.data ? `/events/${call.data.event._id}` : "/opportunities"}
      >
        Back to {call.data ? "the event" : "opportunities"}
      </Link>
      <PageHeader
        eyebrow="YOUR BUSINESS BELONGS HERE"
        title="Apply as a vendor"
        description="Tell the organizer what you will bring. Your application is for this event."
      />
      <ResourceState
        loading={loading}
        error={loadError}
        reload={() => {
          call.reload();
          categories.reload();
          availability.reload();
          applications.reload();
        }}
      />
      {!loading && !loadError && call.data && (
        <div className="poppin-editor-layout">
          <aside className="poppin-editor-aside poppin-application-context">
            <span className="poppin-feature-icon">
              <Store size={26} aria-hidden="true" />
            </span>
            <p className="poppin-eyebrow">YOU’RE APPLYING TO</p>
            <h2>{call.data.event.title}</h2>
            <p>{call.data.description}</p>
            <div className="poppin-context-detail">
              <CalendarDays size={18} aria-hidden="true" />
              <div>
                <span>Application deadline</span>
                <strong>
                  {new Date(call.data.applicationDeadline).toLocaleDateString(
                    "en-PH",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "Asia/Manila",
                    },
                  )}
                </strong>
              </div>
            </div>
            {call.data.event.venue && (
              <div className="poppin-context-detail">
                <MapPin size={18} aria-hidden="true" />
                <div>
                  <span>Meet us at</span>
                  <strong>{call.data.event.venue.name}</strong>
                </div>
              </div>
            )}
            <dl className="poppin-context-numbers">
              <div>
                <dt>Booth fee</dt>
                <dd>₱{call.data.boothFee.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Spaces available</dt>
                <dd>{availability.data?.statistics.slotsRemaining ?? "—"}</dd>
              </div>
            </dl>
            {call.data.requirements.length > 0 && (
              <div className="poppin-context-requirements">
                <h3>Before you apply</h3>
                <ul>
                  {call.data.requirements.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </div>
            )}
            <Link
              className="poppin-inline-link"
              to={`/events/${call.data.event._id}`}
            >
              View event <ArrowUpRight size={16} />
            </Link>
          </aside>
          <div className="poppin-editor-main">
            {applications.data?.length ? (
              <Alert variant="info">
                You already applied to this event.{" "}
                <Link to="/my-applications">View your application</Link>
              </Alert>
            ) : !availability.data?.availability.canApply ? (
              <Alert variant="info">
                Applications are closed, the deadline has passed or all spaces
                are filled.
              </Alert>
            ) : (
              <form
                className="poppin-editor-form"
                noValidate
                onSubmit={handleSubmit(async (values) => {
                  setError("");
                  try {
                    await api.post("/vendor-applications", {
                      ...values,
                      vendorCall: vendorCallId,
                    });
                    toast.success(
                      "Application sent. The organizer will review your business.",
                    );
                    navigate("/my-applications", {
                      state: {
                        message:
                          "Application sent. You can follow its status here.",
                      },
                    });
                  } catch (err) {
                    setError(errorMessage(err));
                  }
                })}
              >
                <section className="poppin-form-section">
                  <p className="poppin-eyebrow">01 / WHAT YOU’RE BRINGING</p>
                  <h2>Your business at this event</h2>
                  <FormField
                    id="application-business"
                    label="Business name"
                    required
                    error={errors.businessName?.message}
                  >
                    <Input
                      maxLength={150}
                      autoComplete="organization"
                      {...register("businessName")}
                    />
                  </FormField>
                  <FormField
                    id="application-category"
                    label="Business category"
                    required
                    error={errors.category?.message}
                  >
                    <Select {...register("category")}>
                      <option value="">Choose a category</option>
                      {options.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField
                    id="application-products"
                    label="Products or services"
                    required
                    error={errors.products?.message}
                  >
                    <Textarea
                      rows={3}
                      maxLength={2000}
                      {...register("products")}
                    />
                  </FormField>
                  <FormField
                    id="application-description"
                    label="About your business (optional)"
                    error={errors.businessDescription?.message}
                  >
                    <Textarea
                      rows={4}
                      maxLength={5000}
                      {...register("businessDescription")}
                    />
                  </FormField>
                  <p className="poppin-field-hint">
                    If accepted, your business name, category, products and
                    description appear in this event's vendor lineup.
                  </p>
                </section>
                <section className="poppin-form-section">
                  <p className="poppin-eyebrow">02 / KEEP IN TOUCH</p>
                  <h2>Contact for the organizer</h2>
                  <div className="poppin-field-pair">
                    <FormField
                      id="application-email"
                      label="Contact email"
                      required
                      error={errors.email?.message}
                    >
                      <Input
                        type="email"
                        autoComplete="email"
                        {...register("email")}
                      />
                    </FormField>
                    <FormField
                      id="application-contact"
                      label="Contact number"
                      required
                      error={errors.contactNumber?.message}
                    >
                      <Input
                        type="tel"
                        autoComplete="tel"
                        maxLength={50}
                        {...register("contactNumber")}
                      />
                    </FormField>
                  </div>
                  <FormField
                    id="application-social"
                    label="Social page (optional)"
                    error={errors.socialMedia?.message}
                  >
                    <Input maxLength={500} {...register("socialMedia")} />
                  </FormField>
                  <FormField
                    id="application-notes"
                    label="Anything the organizer should know? (optional)"
                    error={errors.notes?.message}
                  >
                    <Textarea
                      rows={4}
                      maxLength={2000}
                      {...register("notes")}
                    />
                  </FormField>
                </section>
                {error && <Alert variant="error">{error}</Alert>}
                <div className="poppin-form-footer">
                  <Button type="submit" loading={isSubmitting}>
                    Send application
                  </Button>
                  <p>
                    The organizer will review your application. You can follow
                    its status in My applications.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
