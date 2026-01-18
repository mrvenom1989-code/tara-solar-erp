// src/components/dashboard/Sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client"; // Import Supabase
import { 
  LayoutDashboard, Users, FileText, HardHat, 
  Package, Calendar, BarChart3, Settings, 
  ArrowRight, Sun, FolderKanban, Truck 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState("viewer");

  // 1. GET USER ROLE (Real DB Check)
  useEffect(() => {
    const getUserRole = async () => {
      // A. Get the authenticated user from Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();

      if (user && user.email) {
        // B. Look up their role in our 'users' table
        const { data: dbUser } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email)
          .single();
        
        // C. Set role state (default to viewer if not found)
        if (dbUser && dbUser.role) {
            setRole(dbUser.role.toLowerCase());
        }
      }
    };

    getUserRole();
  }, []);

  // 2. HANDLE LOGOUT
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login"); // Redirect to Login
    router.refresh(); // Force refresh to clear server cache
  };

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/leads", label: "Leads (CRM)", icon: Users },
    { href: "/installations", label: "Installations", icon: FolderKanban },
    { href: "/teams", label: "Field Teams", icon: Truck },
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/documents", label: "Quotations", icon: FileText },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-slate-800 px-6 font-bold text-lg">
        <Sun className="mr-2 h-6 w-6 text-[#F59E0B]" />
        <span>Tara<span className="text-[#65A30D]">Admin</span></span>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <h3 className="mb-2 px-4 text-xs font-semibold uppercase text-slate-500">Operations</h3>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-[#65A30D] text-white" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="mr-3 h-5 w-5 shrink-0" />
              {link.label}
            </Link>
          );
        })}

        {/* Scheduling Group */}
        <div className="mt-8">
            <h3 className="mb-2 px-4 text-xs font-semibold uppercase text-slate-500">Scheduling</h3>
            <Link href="/schedule/residential" className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                <Calendar className="mr-3 h-5 w-5 shrink-0 text-slate-400 group-hover:text-white" />
                Residential Calendar
            </Link>
            <Link href="/schedule/industrial" className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                <BarChart3 className="mr-3 h-5 w-5 shrink-0 text-slate-400 group-hover:text-white" />
                Industrial Gantt
            </Link>
        </div>

        {/* 🔒 ADMIN ONLY SECTION */}
        {role === "admin" && (
            <div className="mt-8">
                <h3 className="mb-2 px-4 text-xs font-semibold uppercase text-slate-500">Administration</h3>
                <Link href="/reports" className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                    <BarChart3 className="mr-3 h-5 w-5 shrink-0 text-slate-400 group-hover:text-white" />
                    Admin Reports
                </Link>
                <Link href="/users" className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                    <Settings className="mr-3 h-5 w-5 shrink-0 text-slate-400 group-hover:text-white" />
                    User Management
                </Link>
            </div>
        )}
      </nav>

      {/* Logout Footer */}
      <div className="border-t border-slate-800 p-4">
        <button 
            onClick={handleSignOut}
            className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
        >
            <ArrowRight className="mr-3 h-5 w-5 rotate-180" />
            Logout
        </button>
      </div>
    </div>
  );
}