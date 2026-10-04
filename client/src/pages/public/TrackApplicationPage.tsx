import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

import api from "../../api/client";

import {
  trackApplicationSchema,
  type TrackApplicationFormData,
} from "../../schemas/trackApplicationSchema";

import type { TrackedApplication } from "../../types/vendorApplication";

export default function TrackApplicationPage() {
  const [application, setApplication] =
    useState<TrackedApplication | null>(null);

  const [searchError, setSearchError] = useState("");

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
      touchedFields,
    },
  } = useForm<TrackApplicationFormData>({
    resolver: zodResolver(trackApplicationSchema),

    mode: "onTouched",

    defaultValues: {
      applicationCode: "",
      email: "",
    },
  });

  async function onSubmit(data: TrackApplicationFormData) {
    try {
      setSearchError("");
      setApplication(null);

      const response =
        await api.get<TrackedApplication>(
          "/vendor-applications/status",
          {
            params: {
              applicationCode:
                data.applicationCode.trim(),
              email: data.email.trim(),
            },
          }
        );

      setApplication(response.data);
    } catch (err) {
      console.error(
        "Failed to track application:",
        err
      );

      if (axios.isAxiosError(err)) {
        setSearchError(
          err.response?.data?.message ||
            "Unable to find application."
        );
      } else {
        setSearchError(
          "Unable to find application."
        );
      }
    }
  }

  return (
    <main
      style={{
        maxWidth: "850px",
        margin: "0 auto",
        padding: "40px 24px",
      }}
    >
      <Link
        to="/"
        style={{
          color: "#333",
          textDecoration: "none",
        }}
      >
        ← Back to Home
      </Link>

      <section
        style={{
          marginTop: "30px",
        }}
      >
        <h1
          style={{
            marginBottom: "8px",
          }}
        >
          Track Vendor Application
        </h1>

        <p
          style={{
            marginTop: 0,
          }}
        >
          Enter your application code and the
          email address you used when applying.
        </p>
      </section>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{
          marginTop: "30px",
          padding: "28px",
          background: "#ffffff",
          border: "1px solid #dddddd",
          borderRadius: "16px",
        }}
      >
        {/* APPLICATION CODE */}
        <div>
          <label
            htmlFor="applicationCode"
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Application Code
          </label>

          <input
            id="applicationCode"
            placeholder="POP-APP-0001"
            {...register("applicationCode")}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "1px solid #cccccc",
              borderRadius: "8px",
              background: "#ffffff",
              outline: "none",
            }}
          />

          {touchedFields.applicationCode &&
            errors.applicationCode && (
              <p
                style={{
                  marginTop: "6px",
                  color: "#b42318",
                  fontSize: "14px",
                }}
              >
                {errors.applicationCode.message}
              </p>
            )}
        </div>

        {/* EMAIL */}
        <div
          style={{
            marginTop: "22px",
          }}
        >
          <label
            htmlFor="email"
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Email Address
          </label>

          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            {...register("email")}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "1px solid #cccccc",
              borderRadius: "8px",
              background: "#ffffff",
              outline: "none",
            }}
          />

          {touchedFields.email &&
            errors.email && (
              <p
                style={{
                  marginTop: "6px",
                  color: "#b42318",
                  fontSize: "14px",
                }}
              >
                {errors.email.message}
              </p>
            )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            marginTop: "26px",
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            cursor: isSubmitting
              ? "not-allowed"
              : "pointer",
            fontWeight: 600,
          }}
        >
          {isSubmitting
            ? "Checking..."
            : "Check Status"}
        </button>
      </form>

      {/* SEARCH ERROR */}
      {searchError && (
        <section
          style={{
            marginTop: "24px",
            padding: "18px",
            border: "1px solid #e0b4b4",
            borderRadius: "12px",
            background: "#fff6f6",
          }}
        >
          <p
            style={{
              margin: 0,
            }}
          >
            {searchError}
          </p>
        </section>
      )}

      {/* APPLICATION RESULT */}
      {application && (
        <section
          style={{
            marginTop: "30px",
            padding: "28px",
            background: "#ffffff",
            border: "1px solid #dddddd",
            borderRadius: "16px",
          }}
        >
          <h2>Application Status</h2>

          <p>
            <strong>Application Code:</strong>{" "}
            {application.applicationCode}
          </p>

          <p>
            <strong>Business:</strong>{" "}
            {application.businessName}
          </p>

          <p>
            <strong>Representative:</strong>{" "}
            {application.representativeName}
          </p>

          <p>
            <strong>Category:</strong>{" "}
            {application.category?.name}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {application.status.toUpperCase()}
          </p>

          <p>
            <strong>Submitted:</strong>{" "}
            {new Date(
              application.submittedAt
            ).toLocaleDateString()}
          </p>

          {application.reviewedAt && (
            <p>
              <strong>Reviewed:</strong>{" "}
              {new Date(
                application.reviewedAt
              ).toLocaleDateString()}
            </p>
          )}

          {application.organizerRemarks && (
            <p>
              <strong>
                Organizer Remarks:
              </strong>{" "}
              {application.organizerRemarks}
            </p>
          )}

          {application.vendorCall?.event && (
            <>
              <hr
                style={{
                  margin: "24px 0",
                }}
              />

              <h3>Event Information</h3>

              <p>
                <strong>Vendor Call:</strong>{" "}
                {application.vendorCall.title}
              </p>

              <p>
                <strong>Event:</strong>{" "}
                {
                  application.vendorCall.event
                    .title
                }
              </p>

              <p>
                <strong>Event Date:</strong>{" "}
                {new Date(
                  application.vendorCall.event
                    .startDate
                ).toLocaleDateString()}
              </p>

              <p>
                <strong>Time:</strong>{" "}
                {
                  application.vendorCall.event
                    .startTime
                }{" "}
                -{" "}
                {
                  application.vendorCall.event
                    .endTime
                }
              </p>

              <p>
                <strong>Booth Fee:</strong>{" "}
                ₱
                {application.vendorCall.boothFee.toLocaleString()}
              </p>
            </>
          )}

          {application.status === "pending" && (
            <p>
              Your application is still being
              reviewed by the organizer.
            </p>
          )}

          {application.status ===
            "approved" && (
            <p>
              Your application has been approved
              by the organizer.
            </p>
          )}

          {application.status ===
            "rejected" && (
            <p>
              Your application was not approved
              for this event.
            </p>
          )}
        </section>
      )}
    </main>
  );
}