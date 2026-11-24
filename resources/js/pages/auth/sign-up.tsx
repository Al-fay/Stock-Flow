import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import AuthLayout from "@/components/auth/auth-layout";

export default function SignUp() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        post("/sign-up", {
            onFinish: () => reset("password", "password_confirmation"),
        });
    }

    return (
        <>
            <Head title="Create Account" />

            <AuthLayout
                title="Create an account"
                description="Mulai kelola bisnis kamu dengan lebih mudah dan terorganisir."
                footer={
                    <>
                        Sudah punya akun?{" "}
                        <Link
                            href="/"
                            className="font-semibold text-primary hover:underline"
                        >
                            Sign in
                        </Link>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="name"
                            className="mb-2 block text-sm font-semibold"
                        >
                            Full name
                        </label>

                        <div className="relative">
                            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

                            <input
                                id="name"
                                type="text"
                                autoComplete="name"
                                placeholder="Your full name"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className="h-12 w-full rounded-xl border border-input bg-background pl-12 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15"
                            />
                        </div>

                        {errors.name && (
                            <p className="mt-2 text-xs font-medium text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

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
                                autoComplete="email"
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

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-semibold"
                        >
                            Password
                        </label>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="Create a password"
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                className="h-12 w-full rounded-xl border border-input bg-background pl-12 pr-12 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
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

                    <div>
                        <label
                            htmlFor="password_confirmation"
                            className="mb-2 block text-sm font-semibold"
                        >
                            Confirm password
                        </label>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

                            <input
                                id="password_confirmation"
                                type={showConfirmation ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="Confirm your password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        "password_confirmation",
                                        e.target.value,
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-input bg-background pl-12 pr-12 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmation(!showConfirmation)
                                }
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={
                                    showConfirmation
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showConfirmation ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>

                        {errors.password_confirmation && (
                            <p className="mt-2 text-xs font-medium text-destructive">
                                {errors.password_confirmation}
                            </p>
                        )}
                    </div>

                    <p className="text-xs leading-5 text-muted-foreground">
                        Dengan membuat akun, kamu menyetujui{" "}
                        <Link
                            href="/terms"
                            className="font-semibold text-primary hover:underline"
                        >
                            Terms of Service
                        </Link>{" "}
                        dan{" "}
                        <Link
                            href="/privacy"
                            className="font-semibold text-primary hover:underline"
                        >
                            Privacy Policy
                        </Link>
                        .
                    </p>

                    <button
                        type="submit"
                        disabled={processing}
                        className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? "Creating account..." : "Create account"}

                        {!processing && (
                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                        )}
                    </button>
                </form>
            </AuthLayout>
        </>
    );
}
