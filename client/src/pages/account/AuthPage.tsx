import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { Input } from "../../components/ui/FormControls";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { authSchema, type AuthFormData } from "../../schemas/authSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../../api/client";
import { useAuth, type SessionResponse } from "../../auth/context";
import FormField from "../../components/forms/FormField";
import { errorMessage } from "../../hooks/useResource";
import { PageHeader } from "../../components/layout/Page";
import { WatercolorSticker } from "../../components/public/MarketDecorations";
import { useUI } from "../../components/ui/context";

export default function AuthPage({
  registering = false,
}: {
  registering?: boolean;
}) {
  const { user, authenticate, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const { toast } = useUI();
  const from =
    typeof location.state?.from === "string" &&
    location.state.from.startsWith("/") &&
    !location.state.from.startsWith("//")
      ? location.state.from
      : "/feed";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema(registering)),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  if (user && !loading) return <Navigate to={from} replace />;
  return (
    <main className="poppin-page poppin-auth-layout">
      <aside
        className="poppin-auth-story"
        aria-label="Welcome to the local circle"
      >
        <p className="poppin-eyebrow">GOOD FINDS. GREAT WEEKENDS.</p>
        <h2>
          A little more local.
          <br />A little more you.
        </h2>
        <p>
          Meet the makers, find your next favorite, and make room for a weekend
          around Pampanga.
        </p>
        <div className="poppin-auth-still-life" aria-hidden="true">
          <WatercolorSticker motif="flower-market-booth" />
          <WatercolorSticker motif="croissant" />
        </div>
      </aside>
      <div className="poppin-auth-form">
        <PageHeader
          eyebrow="Your local circle"
          title={registering ? "Join POPP’IN" : "Welcome back"}
          description={
            registering
              ? "One account to discover local plans, host events and join markets with your business."
              : "Your events and local finds are waiting."
          }
        />
        <form
          noValidate
          onSubmit={handleSubmit(async (values) => {
            setError("");
            try {
              const response = await api.post<SessionResponse>(
                registering ? "/auth/register" : "/auth/login",
                {
                  name: values.name,
                  email: values.email,
                  password: values.password,
                },
              );
              authenticate(response.data);
              toast.success(
                registering
                  ? "Welcome to your local circle!"
                  : "You’re back. Let’s find what’s Popp’in.",
              );
              navigate(from, { replace: true });
            } catch (err) {
              setError(errorMessage(err));
            }
          })}
        >
          {registering && (
            <>
              <FormField
                id="account-name"
                label="Full name"
                required
                error={errors.name?.message}
              >
                <Input
                  autoComplete="name"
                  maxLength={100}
                  {...register("name")}
                />
              </FormField>
            </>
          )}
          <FormField
            id="account-email"
            label="Email"
            required
            error={errors.email?.message}
          >
            <Input type="email" autoComplete="email" {...register("email")} />
          </FormField>
          <FormField
            id="account-password"
            label="Password"
            required
            error={errors.password?.message}
          >
            <Input
              type="password"
              autoComplete={registering ? "new-password" : "current-password"}
              {...register("password")}
            />
          </FormField>
          {registering && (
            <FormField
              id="account-confirm-password"
              label="Confirm password"
              required
              error={errors.confirmPassword?.message}
            >
              <Input
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
            </FormField>
          )}
          {error && <Alert variant="error">{error}</Alert>}
          <Button disabled={isSubmitting} type="submit" loading={isSubmitting}>
            {isSubmitting
              ? "Please wait…"
              : registering
                ? "Create account"
                : "Log in"}
          </Button>
        </form>
        <p>
          {registering ? "Already part of the circle?" : "New around here?"}{" "}
          <Link to={registering ? "/login" : "/register"} state={{ from }}>
            {registering ? "Log in" : "Create an account"}
          </Link>
        </p>
      </div>
    </main>
  );
}
