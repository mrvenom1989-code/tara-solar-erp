// src/app/(admin)/installations/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client"; // Import Supabase
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, MapPin, Zap, ArrowRight, Loader2 } from "lucide-react";

export default function InstallationsListPage() {
  const supabase = createClient();
  const [filter, setFilter] = useState("");
  const [projects, setProjects] = useState<any[]>([]); // State for Real Data
  const [loading, setLoading] = useState(true);

  // FETCH REAL DATA
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching projects:", error);
      } else {
        setProjects(data || []);
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

  // Filter Logic (Updated for DB column names)
  const filteredProjects = projects.filter(p => 
    (p.client_name?.toLowerCase() || "").includes(filter.toLowerCase()) || 
    (p.location?.toLowerCase() || "").includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Active Installations</h1>
           <p className="text-slate-500">Manage ongoing sites, timelines, and documentation.</p>
        </div>
        <div className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search installations..." 
                  className="pl-9 w-64" 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            {/* Note: In a real app, this button would open a "Create Project" Dialog */}
            <Button className="bg-[#65A30D] hover:bg-[#558b0b]">
                <Plus className="w-4 h-4 mr-2" /> New Installation
            </Button>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64 text-slate-500">
           <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading Projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
            No active installations found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredProjects.map((project) => (
               <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer border-slate-200 dark:border-slate-800">
                  <CardContent className="p-6 space-y-4">
                      
                      {/* Header */}
                      <div className="flex justify-between items-start">
                          <Badge variant={project.status === "Completed" ? "default" : "outline"} className={
                              project.status === "Completed" ? "bg-green-100 text-green-700 hover:bg-green-100 border-none" :
                              project.status === "In Progress" ? "bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100" :
                              "bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200"
                          }>
                              {project.status}
                          </Badge>
                          <span className="text-xs font-bold text-slate-400">{project.type}</span>
                      </div>

                      {/* Title */}
                      <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{project.client_name}</h3>
                          <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                              <MapPin className="w-3 h-3" /> {project.location}
                          </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-100 dark:border-slate-800">
                          <div>
                              <p className="text-xs text-slate-400 uppercase font-bold">Capacity</p>
                              <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                                  <Zap className="w-4 h-4 text-[#F59E0B]" /> {project.capacity} kW
                              </div>
                          </div>
                          <div>
                              <p className="text-xs text-slate-400 uppercase font-bold">Stage</p>
                              <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{project.stage}</p>
                          </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-500">
                              <span>Progress</span>
                              <span>{project.progress}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                  className="h-full bg-[#65A30D] transition-all duration-500"
                                  style={{ width: `${project.progress || 0}%` }}
                              ></div>
                          </div>
                      </div>

                      {/* Footer Action */}
                      <Link href={`/installations/${project.id}`}>
                          <Button variant="ghost" className="w-full mt-2 text-[#65A30D] hover:text-[#558b0b] hover:bg-green-50">
                              View Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                      </Link>

                  </CardContent>
               </Card>
           ))}
        </div>
      )}

    </div>
  );
}