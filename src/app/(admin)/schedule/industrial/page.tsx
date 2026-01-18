// src/app/(admin)/schedule/industrial/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, HardHat, Loader2 } from "lucide-react";
import Link from "next/link";

export default function IndustrialSchedulePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // 1. Calculate Days in Month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const daysInMonthCount = new Date(year, month + 1, 0).getDate();
  const daysInMonth = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // 2. FETCH PROJECTS
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      // Fetch only Industrial projects that are In Progress
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('type', 'Industrial')
        .eq('status', 'In Progress');
      
      if (error) console.error("Error fetching projects:", error);
      else setProjects(data || []);
      setLoading(false);
    };

    fetchProjects();
  }, []);

  // 3. HELPER: Calculate Bar Position
  const getBarStyle = (created_at: string) => {
    const startDate = new Date(created_at);
    
    // If project started in a different month/year, handle gracefully
    // For this simple V1, we clamp it to the start of the month if it started earlier
    let startDay = startDate.getDate();
    
    // Check if project is from a previous month
    if (startDate < new Date(year, month, 1)) {
        startDay = 1; // Start at beginning of visible chart
    } else if (startDate > new Date(year, month + 1, 0)) {
        return { display: 'none' }; // Don't show if starts next month
    }

    // Assume a standard 20-day duration for visualization if no end_date exists
    const duration = 20; 
    const endDay = Math.min(startDay + duration, daysInMonthCount);
    const widthDays = endDay - startDay;

    const leftPercent = ((startDay - 1) / daysInMonthCount) * 100;
    const widthPercent = (widthDays / daysInMonthCount) * 100;

    return {
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        marginLeft: '2px',
        marginRight: '2px'
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Industrial Schedule</h1>
           <p className="text-slate-500">{monthName} {year} - Gantt View</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Link href="/installations">
                <Button className="bg-[#65A30D] text-white hover:bg-[#4d7c0f]">+ New Project</Button>
            </Link>
        </div>
      </div>

      {/* Monthly Gantt-style Grid */}
      <div className="border rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
        {/* Fixed: Updated min-w-[1000px] to min-w-250 */}
        <div className="min-w-250"> 
            
            {/* Calendar Header Row */}
            <div className="grid grid-cols-[250px_1fr] border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-950 sticky top-0 z-10">
                <div className="p-4 font-bold text-slate-700 dark:text-slate-300 border-r dark:border-slate-800">
                    Project Name
                </div>
                <div className="grid" style={{ gridTemplateColumns: `repeat(${daysInMonthCount}, minmax(30px, 1fr))` }}>
                    {daysInMonth.map(d => (
                        <div key={d} className="border-l dark:border-slate-800 py-2 text-center text-xs text-slate-500 font-medium">
                            {d}
                        </div>
                    ))}
                </div>
            </div>

            {/* Project Rows */}
            {loading ? (
                <div className="p-12 text-center text-slate-500 flex justify-center items-center">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Timeline...
                </div>
            ) : projects.length === 0 ? (
                <div className="p-12 text-center text-slate-500 italic">
                    No active industrial projects for this period.
                </div>
            ) : (
                projects.map((project, index) => {
                    // Assign random colors for visual distinction based on ID
                    const colors = [
                        "bg-blue-100 text-blue-700 border-blue-200",
                        "bg-orange-100 text-orange-700 border-orange-200",
                        "bg-green-100 text-green-700 border-green-200",
                        "bg-purple-100 text-purple-700 border-purple-200"
                    ];
                    const colorClass = colors[project.id % colors.length];

                    return (
                        <div key={project.id} className="grid grid-cols-[250px_1fr] border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            {/* Project Title */}
                            <div className="p-4 text-sm font-semibold text-slate-900 dark:text-white border-r dark:border-slate-800 flex items-center gap-2 overflow-hidden">
                                <HardHat className="w-4 h-4 text-slate-400 shrink-0"/>
                                <span className="truncate">{project.client_name}</span>
                            </div>
                            
                            {/* Timeline Grid */}
                            <div className="relative h-12 flex items-center">
                                {/* Grid Lines Background */}
                                <div className="absolute inset-0 grid h-full w-full" style={{ gridTemplateColumns: `repeat(${daysInMonthCount}, minmax(30px, 1fr))` }}>
                                    {daysInMonth.map(d => (
                                         <div key={d} className="h-full border-l dark:border-slate-800 pointer-events-none"></div>
                                    ))}
                                </div>
                                
                                {/* The Actual Bar */}
                                <div 
                                    className={`absolute h-8 rounded-md text-xs flex items-center px-2 font-medium shadow-sm border ${colorClass}`}
                                    style={getBarStyle(project.created_at)}
                                >
                                    <span className="truncate">{project.stage || "In Progress"}</span>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
    </div>
  );
}