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
import { ArrowUpRight, CalendarDays, Compass, Store } from "lucide-react";
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
        aria-label="Discover local events with POPP'IN"
      >
        <Link className="poppin-auth-brand" to="/">
          POPP’IN <ArrowUpRight size={24} />
        </Link>
        <div className="poppin-auth-message">
          <p className="poppin-eyebrow">YOUR NEXT GOOD PLAN STARTS HERE</p>
          <h2>
            Go out. <br />
            Find your <br />
            <span>people.</span>
          </h2>
          <p>
            Markets, makers and moments worth showing up for. Get closer to
            what’s happening around Pampanga.
          </p>
        </div>
        <div className="poppin-auth-benefits">
          <div>
            <span className="poppin-auth-benefit-index">01</span>
            <Compass size={20} />
            <span>Discover something local</span>
          </div>
          <div>
            <span className="poppin-auth-benefit-index">02</span>
            <CalendarDays size={20} />
            <span>Bring your own event to life</span>
          </div>
          <div>
            <span className="poppin-auth-benefit-index">03</span>
            <Store size={20} />
            <span>Find a space for your business</span>
          </div>
        </div>
        <p className="poppin-auth-edition">
          PAMPANGA, PH <span>GOOD PLANS. REAL CONNECTIONS.</span>
        </p>
      </aside>
      <div className="poppin-auth-form">
        <PageHeader
          eyebrow={
            registering ? "LET’S GET YOU STARTED" : "GOOD TO SEE YOU AGAIN"
          }
          title={registering ? "Join POPP’IN" : "Welcome back"}
          description={
            registering
              ? "One account. Every way to take part."
              : "Log in to pick up where you left off."
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
        <p className="poppin-auth-switch">
          {registering ? "Already part of the circle?" : "New around here?"}{" "}
          <Link to={registering ? "/login" : "/register"} state={{ from }}>
            {registering ? "Log in" : "Create an account"}
          </Link>
        </p>
      </div>
    </main>
  );
}
