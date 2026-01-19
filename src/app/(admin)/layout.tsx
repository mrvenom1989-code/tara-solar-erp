// src/app/(admin)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client"; // Use Supabase
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Loader2, Sun } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);

  // 🔒 AUTH PROTECTION (Client-Side Fail-safe)
  // Middleware handles the main protection, this prevents flashes of content
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setIsLoading(false);
      }
    };
    checkUser();
  }, [router]);

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
            <Loader2 className="h-8 w-8 animate-spin text-[#65A30D]" />
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      
      {/* 1. Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden md:block h-full">
        <Sidebar />
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
          
          {/* 2. Mobile Header (Visible only on Mobile) */}
          <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
             <div className="flex items-center gap-2 font-bold text-lg">
                <Sun className="h-6 w-6 text-[#F59E0B]" />
                <span>Tara<span className="text-[#65A30D]">Admin</span></span>
             </div>
             <MobileNav />
          </div>

          {/* 3. Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
      </div>
      
    </div>
  );
}