// src/components/dashboard/MobileNav.tsx
"use client";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Sun } from "lucide-react";
import { Sidebar } from "./Sidebar"; 

export function MobileNav() {
  return (
    <div className="flex md:hidden items-center justify-between p-4 border-b bg-slate-900 text-white">
      
      {/* Brand */}
      <div className="flex items-center gap-2 font-bold text-lg">
        <Sun className="h-6 w-6 text-[#F59E0B]" />
        <span>Tara<span className="text-[#65A30D]">Admin</span></span>
      </div>

      {/* Hamburger Menu Trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        
        {/* Slide-out Content */}
        <SheetContent side="left" className="p-0 border-r-slate-800 bg-slate-900 w-72 text-white">
           
           {/* ✅ ACCESSIBILITY FIX: Required Title (Hidden Visually) */}
           <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>

           {/* Reuse Sidebar */}
           <div className="h-full">
             <Sidebar /> 
           </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}