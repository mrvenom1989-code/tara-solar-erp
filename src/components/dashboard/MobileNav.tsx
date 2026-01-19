// src/components/dashboard/MobileNav.tsx
"use client";

import { useEffect, useState } from "react"; // Import useEffect
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar"; 

export function MobileNav() {
  const [isMounted, setIsMounted] = useState(false);

  // 1. Fix Hydration Error: Only render after client loads
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Return null on server to prevent ID mismatch
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-slate-800">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      
      {/* Slide-out Content */}
      <SheetContent side="left" className="p-0 border-r-slate-800 bg-slate-900 w-72 text-white">
          
          {/* Accessibility Title */}
          <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>

          {/* Reuse Sidebar */}
          <div className="h-full">
            <Sidebar /> 
          </div>
      </SheetContent>
    </Sheet>
  );
}