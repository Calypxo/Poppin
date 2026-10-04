import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

import api from "../../api/client";

import type { VendorCall } from "../../types/vendorCall";

import {
  vendorApplicationSchema,
  type VendorApplicationFormData,
} from "../../schemas/vendorApplicationSchema";

export default function VendorApplicationPage() {
  const { vendorCallId } = useParams();

  const [vendorCall, setVendorCall] =
    useState<VendorCall | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [pageError, setPageError] =
    useState("");

  const [submitError, setSubmitError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [applicationCode, setApplicationCode] =
    useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<VendorApplicationFormData>({
    resolver: zodResolver(
      vendorApplicationSchema
    ),
    defaultValues: {
      businessName: "",
      representativeName: "",
      email: "",
      contactNumber: "",
      category: "",
      products: "",
      businessDescription: "",
      socialMedia: "",
      notes: "",
    },
  });

  // ----------------------------------------------------
  // LOAD VENDOR CALL
  // ----------------------------------------------------
  useEffect(() => {
    async function fetchVendorCall() {
      if (!vendorCallId) {
        setPageError(
          "Vendor call ID is missing."
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPageError("");

        const response =
          await api.get<VendorCall>(
            `/vendor-calls/${vendorCallId}`
          );

        setVendorCall(response.data);
      } catch (err) {
        console.error(
          "Failed to load vendor call:",
          err
        );

        setPageError(
          "Unable to load this vendor application."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchVendorCall();
  }, [vendorCallId]);

  // ----------------------------------------------------
  // SUBMIT APPLICATION
  // ----------------------------------------------------
  async function onSubmit(
    data: VendorApplicationFormData
  ) {
    if (!vendorCallId) {
      return;
    }

    try {
      setSubmitError("");
      setSuccessMessage("");
      setApplicationCode("");

      const response = await api.post(
        "/vendor-applications",
        {
          vendorCall: vendorCallId,

          businessName:
            data.businessName,

          representativeName:
            data.representativeName,

          email: data.email,

          contactNumber:
            data.contactNumber,

          category: data.category,

          products: data.products,

          businessDescription:
            data.businessDescription,

          socialMedia:
            data.socialMedia || "",

          notes:
            data.notes || "",
        }
      );

      setSuccessMessage(
        response.data.message
      );

      setApplicationCode(
        response.data.application
          .applicationCode
      );

      reset();
    } catch (err) {
      console.error(
        "Application failed:",
        err
      );

      if (axios.isAxiosError(err)) {
        setSubmitError(
          err.response?.data?.message ||
            "Unable to submit application."
        );
      } else {
        setSubmitError(
          "Unable to submit application."
        );
      }
    }
  }

  // ----------------------------------------------------
  // LOADING
  // ----------------------------------------------------
  if (loading) {
    return (
      <main
        style={{
          maxWidth: "850px",
          margin: "0 auto",
          padding: "40px 24px",
        }}
      >
        <p>
          Loading vendor application...
        </p>
      </main>
    );
  }

  // ----------------------------------------------------
  // PAGE ERROR
  // ----------------------------------------------------
  if (pageError) {
    return (
      <main
        style={{
          maxWidth: "850px",
          margin: "0 auto",
          padding: "40px 24px",
        }}
      >
        <h1>
          Vendor Application
        </h1>

        <p>{pageError}</p>

        <Link to="/discover">
          Back to Discover
        </Link>
      </main>
    );
  }

  if (!vendorCall) {
    return null;
  }

  return (
    <main
      style={{
        maxWidth: "850px",
        margin: "0 auto",
        padding: "40px 24px",
      }}
    >
      <Link to="/discover">
        ← Back to Discover
      </Link>

      <section
        style={{
          marginTop: "24px",
        }}
      >
        <h1>
          Apply as a Vendor
        </h1>

        <h2>
          {vendorCall.title}
        </h2>

        <p>
          {vendorCall.description}
        </p>

        <p>
          <strong>Event:</strong>{" "}
          {vendorCall.event?.title}
        </p>

        <p>
          <strong>
            Application Deadline:
          </strong>{" "}
          {new Date(
            vendorCall.applicationDeadline
          ).toLocaleDateString()}
        </p>

        <p>
          <strong>Booth Fee:</strong>{" "}
          ₱
          {vendorCall.boothFee.toLocaleString()}
        </p>

        {vendorCall.boothSize && (
          <p>
            <strong>
              Booth Size:
            </strong>{" "}
            {vendorCall.boothSize}
          </p>
        )}

        {vendorCall.requirements.length >
          0 && (
          <>
            <h3>Requirements</h3>

            <ul>
              {vendorCall.requirements.map(
                (requirement) => (
                  <li key={requirement}>
                    {requirement}
                  </li>
                )
              )}
            </ul>
          </>
        )}
      </section>

      <hr
        style={{
          margin: "30px 0",
        }}
      />

      {successMessage && (
        <section
          style={{
            padding: "20px",
            marginBottom: "24px",
            background: "#f1fff3",
            border: "1px solid #aaa",
            borderRadius: "12px",
          }}
        >
          <h2>
            Application Submitted
          </h2>

          <p>{successMessage}</p>

          <p>
            <strong>
              Your Application Code:
            </strong>
          </p>

          <p
            style={{
              fontSize: "22px",
              fontWeight: "bold",
            }}
          >
            {applicationCode}
          </p>

          <p>
            Save this code. You will
            need it together with your
            email to track your
            application.
          </p>

          <Link to="/track-application">
            Track Application
          </Link>
        </section>
      )}

      {submitError && (
        <p>
          {submitError}
        </p>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
      >
        <div>
          <label>
            Business Name
          </label>

          <br />

          <input
            {...register(
              "businessName"
            )}
          />

          {errors.businessName && (
            <p>
              {
                errors.businessName
                  .message
              }
            </p>
          )}
        </div>

        <br />

        <div>
          <label>
            Representative Name
          </label>

          <br />

          <input
            {...register(
              "representativeName"
            )}
          />

          {errors.representativeName && (
            <p>
              {
                errors
                  .representativeName
                  .message
              }
            </p>
          )}
        </div>

        <br />

        <div>
          <label>Email</label>

          <br />

          <input
            type="email"
            {...register("email")}
          />

          {errors.email && (
            <p>
              {errors.email.message}
            </p>
          )}
        </div>

        <br />

        <div>
          <label>
            Contact Number
          </label>

          <br />

          <input
            {...register(
              "contactNumber"
            )}
          />

          {errors.contactNumber && (
            <p>
              {
                errors.contactNumber
                  .message
              }
            </p>
          )}
        </div>

        <br />

        <div>
          <label>
            Business Category
          </label>

          <br />

          <select
            {...register("category")}
          >
            <option value="">
              Select category
            </option>

            {vendorCall.acceptedCategories.map(
              (category) => (
                <option
                  key={category._id}
                  value={category._id}
                >
                  {category.name}
                </option>
              )
            )}
          </select>

          {errors.category && (
            <p>
              {
                errors.category
                  .message
              }
            </p>
          )}
        </div>

        <br />

        <div>
          <label>
            Products / Services
          </label>

          <br />

          <textarea
            rows={4}
            {...register("products")}
          />

          {errors.products && (
            <p>
              {
                errors.products
                  .message
              }
            </p>
          )}
        </div>

        <br />

        <div>
          <label>
            Business Description
          </label>

          <br />

          <textarea
            rows={5}
            {...register(
              "businessDescription"
            )}
          />

          {errors.businessDescription && (
            <p>
              {
                errors
                  .businessDescription
                  .message
              }
            </p>
          )}
        </div>

        <br />

        <div>
          <label>
            Social Media
          </label>

          <br />

          <input
            placeholder="@yourbusiness"
            {...register(
              "socialMedia"
            )}
          />
        </div>

        <br />

        <div>
          <label>
            Additional Notes
          </label>

          <br />

          <textarea
            rows={4}
            {...register("notes")}
          />
        </div>

        <br />

        <button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Submitting..."
            : "Submit Application"}
        </button>
      </form>
    </main>
  );
}