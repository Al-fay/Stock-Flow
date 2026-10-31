import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import AuthLayout from "@/components/auth/auth-layout";

export default function SignIn() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        post("/sign-in", {
            onFinish: () => reset("password"),
        });
    }

    return (
        <>
            <Head title="Sign In" />

            <AuthLayout
                title="Welcome back"
                description="Masuk ke akun kamu untuk melanjutkan aktivitas bisnis."
                footer={
                    <>
                        Belum punya akun?{" "}
                        <Link
                            href="/sign-up"
                            className="font-semibold text-primary hover:underline"
                        >
                            Buat akun
                        </Link>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-semibold"
                        >
                            Email address
                        </label>

                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

                            <input
                                id="email"
                                type="email"
                                autoComplete="us"
                                autoFocus
                                required
                                placeholder="name@example.com"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                className="h-12 w-full rounded-xl border border-input bg-background pl-12 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15"
                            />
                        </div>

                        {errors.email && (
                            <p className="mt-2 text-xs font-medium text-destructive">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <label
                                htmlFor="password"
                                className="text-sm font-semibold"
                            >
                                Password
                            </label>

                            <Link
                                href="/forgot-password"
                                className="text-xs font-semibold text-primary hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                required
                                placeholder="Enter your password"
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                className="h-12 w-full rounded-xl border border-input bg-background pl-12 pr-12 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword((previous) => !previous)
                                }
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>

                        {errors.password && (
                            <p className="mt-2 text-xs font-medium text-destructive">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Remember me */}
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) =>
                                setData("remember", e.target.checked)
                            }
                            className="h-4 w-4 rounded border-input accent-primary"
                        />

                        <span className="text-sm text-muted-foreground">
                            Remember me
                        </span>
                    </label>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing
                            ? "Signing in..."
                            : "Sign in to your account"}

                        {!processing && (
                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                        )}
                    </button>
                </form>
            </AuthLayout>
        </>
    );
}
