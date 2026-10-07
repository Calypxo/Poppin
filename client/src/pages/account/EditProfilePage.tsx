import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { Input, Textarea, Select } from "../../components/ui/FormControls";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Tabs from "../../components/ui/Tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  profileSchema,
  type ProfileFormData,
  type ProfileSection,
} from "../../schemas/profileSchema";
import { useForm, useWatch } from "react-hook-form";
import { useAuth } from "../../auth/context";
import api from "../../api/client";
import useResource, { errorMessage } from "../../hooks/useResource";
import type { MyProfiles } from "../../types/account";
import type { Category } from "../../types/event";
import ResourceState from "../../components/shared/ResourceState";
import FormField from "../../components/forms/FormField";
import ImageUploader from "../../components/forms/ImageUploader";
import { PageHeader } from "../../components/layout/Page";
import { useUI } from "../../components/ui/context";
export default function EditProfilePage() {
  const { user, refresh } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedSection = params.get("section");
  const section: ProfileSection =
    requestedSection === "organizer" ||
    (requestedSection === "vendor" && !!user?.vendorId)
      ? requestedSection
      : "personal";
  const requestedReturn = params.get("returnTo") || "";
  const returnTo =
    /^\/(?:events\/(?:new|[a-f\d]{24})(?:\/(?:edit|posts|vendor-call|applications))?|vendor-application\/[a-f\d]{24}|my-events|opportunities|applications)$/.test(
      requestedReturn,
    )
      ? requestedReturn
      : "";
  const { toast } = useUI();
  const resource = useResource<MyProfiles>("/profiles/me");
  const categories = useResource<Category[]>("/categories");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema(section)),
  });
  const avatar = useWatch({ control, name: "avatarUrl" });
  const logo = useWatch({ control, name: "logoUrl" });
  useEffect(() => {
    if (!resource.data) return;
    const { user: person } = resource.data;
    const business =
      section === "organizer"
        ? resource.data.organizer
        : section === "vendor"
          ? resource.data.vendor
          : null;
    reset({
      name: person.name,
      bio: person.bio,
      avatarUrl: person.avatarUrl,
      businessName: business
        ? "businessName" in business
          ? business.businessName
          : business.name
        : "",
      description: business?.description || "",
      logoUrl: business?.logoUrl || "",
      category:
        business && "category" in business ? business.category?._id || "" : "",
      products: business && "products" in business ? business.products : "",
      city: business?.city || person.city,
      contactNumber: business?.contactNumber || person.contactNumber,
      email: business?.email || person.email,
      socialMedia: business?.socialMedia || "",
    });
  }, [resource.data, reset, section]);
  return (
    <main className="poppin-page poppin-form-page">
      <Link to="/profile">← Your profile</Link>
      <PageHeader
        eyebrow="Your local story"
        title={
          section === "personal"
            ? "Edit your profile"
            : section === "organizer"
              ? "Your organizer details"
              : "Your business details"
        }
        description="Tell your story, add a photo, and help your local circle get to know you."
      />
      <ResourceState {...resource} />
      <Tabs
        label="Profile details"
        value={section}
        onChange={(value) => {
          setError("");
          setMessage("");
          setParams((current) => {
            current.set("section", value);
            return current;
          });
        }}
        items={[
          { value: "personal", label: "About you" },
          { value: "organizer", label: "Organize events" },
          ...(user?.vendorId
            ? [{ value: "vendor", label: "Business details" }]
            : []),
        ]}
      >
        {resource.data && (
          <form
            noValidate
            onSubmit={handleSubmit(async (data) => {
              if (!resource.data) return;
              setError("");
              setMessage("");
              try {
                const business =
                  section === "organizer"
                    ? resource.data.organizer
                    : resource.data.vendor;
                const payload =
                  section === "personal"
                    ? {
                        name: data.name,
                        bio: data.bio,
                        avatarUrl: data.avatarUrl,
                        city: data.city,
                        contactNumber: data.contactNumber,
                      }
                    : data;
                if (section === "personal" || business)
                  await api.patch(
                    section === "personal"
                      ? "/profiles/me"
                      : `/profiles/${section}`,
                    payload,
                  );
                else await api.post(`/profiles/${section}`, payload);
                setMessage("Your profile has been updated.");
                toast.success("Your profile is updated. Looking good!");
                await refresh();
                resource.reload();
                if (returnTo && section !== "personal") navigate(returnTo);
                else if (section === "organizer" && !business)
                  navigate("/profile");
              } catch (err) {
                setError(errorMessage(err));
              }
            })}
          >
            {section === "personal" && (
              <FormField
                id="profile-name"
                label="Your name"
                error={errors.name?.message}
              >
                <Input
                  {...register("name", {
                    required: "Enter your name",
                    minLength: {
                      value: 2,
                      message: "Use at least 2 characters",
                    },
                  })}
                  maxLength={100}
                />
              </FormField>
            )}
            {section === "personal" ? (
              <>
                <FormField id="profile-bio" label="About you">
                  <Textarea rows={4} maxLength={2000} {...register("bio")} />
                </FormField>
                <ImageUploader
                  label="Profile photo"
                  value={avatar || ""}
                  onChange={(value) => setValue("avatarUrl", value)}
                  onBusy={setBusy}
                />
              </>
            ) : (
              <>
                <FormField
                  id="profile-business"
                  label={
                    section === "organizer" ? "Organizer name" : "Business name"
                  }
                  error={errors.businessName?.message}
                >
                  <Input
                    {...register("businessName", {
                      required: "Enter a business name",
                    })}
                    maxLength={150}
                  />
                </FormField>
                <FormField
                  id="profile-description"
                  label="Your story"
                  error={errors.description?.message}
                >
                  <Textarea
                    rows={5}
                    maxLength={5000}
                    {...register("description", {
                      required: "Tell us about your business",
                    })}
                  />
                </FormField>
                <ImageUploader
                  label="Business logo"
                  value={logo || ""}
                  onChange={(value) => setValue("logoUrl", value)}
                  onBusy={setBusy}
                />
                {section === "vendor" && (
                  <>
                    <FormField
                      id="profile-category"
                      label="Business category"
                      error={errors.category?.message}
                    >
                      <Select
                        {...register("category", {
                          required: "Choose a category",
                        })}
                      >
                        <option value="">Choose category</option>
                        {categories.data?.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <ResourceState
                      loading={categories.loading}
                      error={categories.error}
                      reload={categories.reload}
                    />
                    <FormField
                      id="profile-products"
                      label="Products or services"
                      error={errors.products?.message}
                    >
                      <Textarea
                        maxLength={2000}
                        {...register("products", {
                          required: "Describe your products or services",
                        })}
                      />
                    </FormField>
                  </>
                )}
                <FormField
                  id="profile-email"
                  label="Public contact email"
                  error={errors.email?.message}
                >
                  <Input
                    type="email"
                    {...register("email", {
                      required: "Enter a contact email",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email",
                      },
                    })}
                  />
                </FormField>
                <FormField id="profile-social" label="Social page">
                  <Input {...register("socialMedia")} />
                </FormField>
              </>
            )}
            <div className="poppin-field-pair">
              <FormField
                id="profile-city"
                label="City"
                error={errors.city?.message}
              >
                <Input
                  {...register("city", {
                    required:
                      section !== "personal" ? "Enter your city" : false,
                  })}
                />
              </FormField>
              <FormField
                id="profile-contact"
                label="Contact number"
                error={errors.contactNumber?.message}
              >
                <Input
                  type="tel"
                  {...register("contactNumber", {
                    required:
                      section !== "personal" ? "Enter a contact number" : false,
                  })}
                />
              </FormField>
            </div>
            {error && <Alert variant="error">{error}</Alert>}
            {message && <Alert variant="success">{message}</Alert>}
            <Button disabled={busy || isSubmitting} type="submit">
              {section === "organizer" && !resource.data.organizer
                ? "Create organizer profile"
                : "Save profile"}
            </Button>
          </form>
        )}
      </Tabs>
    </main>
  );
}
