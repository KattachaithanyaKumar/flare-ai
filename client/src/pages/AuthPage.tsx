import { Button, ConfigProvider, Input } from "antd";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

const AuthPage = () => {
  const { pathname } = useLocation();
  const isRegister = pathname.toLowerCase().includes("register");

  const visualPanel = (
    <aside className="relative hidden h-dvh overflow-hidden bg-[#110e0c] lg:flex lg:flex-col lg:justify-between">
      <img
        src="https://images.pexels.com/photos/36975504/pexels-photo-36975504.jpeg"
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover"
      />
    </aside>
  );

  const authForm = (
    <main className="flex min-h-dvh items-center justify-center overflow-y-auto bg-white px-6 py-12 sm:px-12 lg:h-dvh lg:min-h-0 lg:px-16">
      <div className="w-full max-w-md">
        {/* Mobile logo */}
        <img src={logo} alt="Flare AI" className="mb-12 h-9 w-auto lg:hidden" />

        {/* Header */}
        <header className="mb-9">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            {isRegister ? "GET STARTED" : "WELCOME BACK"}
          </span>

          <h1 className="text-3xl font-bold tracking-tight text-[#171717] sm:text-4xl">
            {isRegister ? "Create an account" : "Welcome back"}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            {isRegister
              ? "Create your Flare AI account and start exploring."
              : "Enter your details to access your AI workspace."}
          </p>
        </header>

        {/* Form */}
        <form
          className="space-y-5"
          onSubmit={(event) => event.preventDefault()}
        >
          {/* Full name */}
          {isRegister && (
            <div className="space-y-2">
              <label
                htmlFor="full-name"
                className="block text-sm font-medium text-slate-700"
              >
                Full name
              </label>

              <Input
                id="full-name"
                size="large"
                placeholder="Enter your full name"
                autoComplete="name"
                className="!h-12"
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Email address
            </label>

            <Input
              id="email"
              type="email"
              size="large"
              placeholder="you@example.com"
              autoComplete="email"
              className="!h-12"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <Input.Password
              id="password"
              size="large"
              placeholder={
                isRegister ? "Create a password" : "Enter your password"
              }
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="!h-12"
            />
          </div>

          {/* Forgot password */}
          {!isRegister && (
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-orange-600 transition hover:text-orange-700"
              >
                Forgot password?
              </Link>
            </div>
          )}

          {/* Submit */}
          <div className="pt-3">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              className="!h-12 !border-0 !font-semibold !shadow-lg !shadow-orange-500/20"
            >
              {isRegister ? "Create account" : "Log in"}
              <span className="ml-2">→</span>
            </Button>
          </div>
        </form>

        {/* Login / Register navigation */}
        <p className="mt-9 text-center text-sm text-slate-500">
          {isRegister
            ? "Already have an account?"
            : "Don't have an account yet?"}{" "}
          <Link
            to={isRegister ? "/login" : "/register"}
            className="font-semibold text-orange-600 transition hover:text-orange-700 hover:underline"
          >
            {isRegister ? "Log in" : "Create account"}
          </Link>
        </p>

        {/* Footer */}
        <p className="mt-12 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Flare AI. All rights reserved.
        </p>
      </div>
    </main>
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#f97316",
          colorInfo: "#f97316",
          borderRadius: 10,
          borderRadiusLG: 12,
          controlHeightLG: 48,
          fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif",
        },
        components: {
          Button: {
            fontWeight: 600,
          },
          Input: {
            activeBorderColor: "#f97316",
            hoverBorderColor: "#fb923c",
          },
        },
      }}
    >
      <div className="h-dvh w-full overflow-hidden bg-white">
        <div className="grid h-full w-full lg:grid-cols-2">
          {isRegister ? (
            <>
              {visualPanel}
              {authForm}
            </>
          ) : (
            <>
              {visualPanel}
              {authForm}
            </>
          )}
        </div>
      </div>
    </ConfigProvider>
  );
};

export default AuthPage;
