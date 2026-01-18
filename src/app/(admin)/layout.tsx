// src/app/(admin)/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // 🔒 AUTH PROTECTION: Kicks user back to login if no session found
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* 1. Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* 2. Mobile Navbar (Visible only on Mobile) */}
      <MobileNav />

      {/* 3. Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
      
    </div>
  );
}