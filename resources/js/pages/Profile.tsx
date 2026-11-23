import DashboardLayout from "@/layouts/dashboard-layout";
import { Head } from "@inertiajs/react";
import { Lock, Mail, User, ShieldCheck } from "lucide-react";

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at?: string;
}

interface ProfileProps {
    user: User;
}

export default function Profile({ user }: ProfileProps) {
    const initials = user.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

    const verified = Boolean(user.email_verified_at);

    return (
        <>
            <Head title="My Profile" />

            <DashboardLayout>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Profil Saya
                        </h1>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Kelola informasi dan keamanan akun Anda.
                        </p>
                    </div>

                    {/* Profile Banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-linear-to-r bg-primary via-background to-bg-primary-subtle p-6 sm:p-8 mb-8 shadow-lg shadow-indigo-500/20">
                        <div className="absolute -right-10 -top-20 w-64 h-64 rounded-full bg-white/10" />
                        <div className="absolute right-32 -bottom-24 w-48 h-48 rounded-full bg-white/10" />

                        <div className="relative flex flex-col sm:flex-row items-center gap-6">
                            <div className="w-24 h-24 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                                {initials}
                            </div>

                            <div className="text-center sm:text-left flex-1">
                                <p className="text-sm mb-1 text-black dark:text-white">
                                    Selamat Datang!
                                </p>

                                <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
                                    {user.name}
                                </h2>

                                <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-black dark:text-white border border-white/20">
                                    Akun Pribadi
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Personal Information */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <User size={20} />
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">
                                            Informasi Pribadi
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Detail informasi akun Anda
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Name */}
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                        <User size={20} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                                            Nama Lengkap
                                        </p>
                                        <p className="mt-1 font-semibold text-gray-900 dark:text-white wrap-break-word">
                                            {user.name}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-800" />

                                {/* Email */}
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                        <Mail size={20} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                                            Alamat Email
                                        </p>
                                        <p className="mt-1 font-semibold text-gray-900 dark:text-white break-all">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Account Status */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    Status Akun
                                </h3>

                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Status verifikasi alamat email
                                </p>

                                <div className="mt-6 flex flex-col items-center text-center">
                                    <div
                                        className={`w-20 h-20 rounded-full flex items-center justify-center ${
                                            verified
                                                ? "bg-emerald-50 dark:bg-emerald-500/10"
                                                : "bg-amber-50 dark:bg-amber-500/10"
                                        }`}
                                    >
                                        {verified ? (
                                            <ShieldCheck
                                                size={40}
                                                className="text-emerald-500"
                                            />
                                        ) : (
                                            <Lock
                                                size={36}
                                                className="text-amber-500"
                                            />
                                        )}
                                    </div>

                                    <h4 className="mt-4 font-bold text-gray-900 dark:text-white">
                                        {verified
                                            ? "Email Terverifikasi"
                                            : "Email Belum Terverifikasi"}
                                    </h4>

                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        {verified
                                            ? "Email Anda telah berhasil diverifikasi."
                                            : "Verifikasi email untuk meningkatkan keamanan akun Anda."}
                                    </p>

                                    <span
                                        className={`mt-4 px-4 py-2 rounded-full text-xs font-semibold ${
                                            verified
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                                        }`}
                                    >
                                        {verified
                                            ? "Aktif & Terverifikasi"
                                            : "Menunggu Verifikasi"}
                                    </span>
                                </div>
                            </div>

                            {/* Security Card */}
                            <div className="relative overflow-hidden rounded-2xl bg-linear-to-r bg-primary via-background to-bg-primary-subtle p-6 shadow-lg shadow-indigo-500/20">
                                <div className="flex items-center gap-2">
                                    <Lock
                                        className="text-black dark:text-white"
                                        size={20}
                                    />
                                    <span className="text-sm text-black dark:text-white">
                                        Keamanan Akun
                                    </span>
                                </div>

                                <h3 className="mt-4 text-xl font-bold text-black dark:text-white">
                                    Lindungi akun Anda.
                                </h3>

                                <p className="mt-2 text-sm text-black dark:text-white leading-relaxed">
                                    Jaga kerahasiaan informasi login dan jangan
                                    membagikan kata sandi kepada orang lain.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center text-xs text-gray-400">
                        © {new Date().getFullYear()} Dasbor. Hak cipta
                        dilindungi undang-undang.
                    </div>
                </div>
            </DashboardLayout>
        </>
    );
}
