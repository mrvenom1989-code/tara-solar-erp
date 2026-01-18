// src/app/(admin)/schedule/residential/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MapPin, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ResidentialSchedulePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // New Job State
  const [newJob, setNewJob] = useState({
    client_name: "",
    city: "",
    date: "", // YYYY-MM-DD
    time_slot: "",
    team: "Team Alpha",
    status: "Survey"
  });

  // 1. FETCH JOBS
  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) console.error("Error fetching jobs:", error);
    else setJobs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // 2. ADD NEW JOB
  const handleAddJob = async () => {
    const { error } = await supabase.from('jobs').insert([newJob]);
    if (!error) {
        setIsDialogOpen(false);
        fetchJobs(); // Refresh list
        setNewJob({ client_name: "", city: "", date: "", time_slot: "", team: "Team Alpha", status: "Survey" });
    } else {
        alert("Error creating job");
    }
  };

  // Helper: Get Day Name from Date String (e.g., "2026-01-20" -> "Tuesday")
  const getDayName = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Residential Schedule</h1>
          <p className="text-slate-500">Weekly View</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
           <span className="flex items-center px-4 font-bold border rounded-md bg-white dark:bg-slate-900">
               Current Week
           </span>
           <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
           
           {/* ADD JOB DIALOG */}
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-[#65A30D] text-white hover:bg-[#4d7c0f]">
                        <Plus className="w-4 h-4 mr-2"/> Add Job
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Schedule New Job</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Client</Label>
                            <Input value={newJob.client_name} onChange={e => setNewJob({...newJob, client_name: e.target.value})} className="col-span-3" placeholder="e.g. Patel Villa" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Date</Label>
                            <Input type="date" value={newJob.date} onChange={e => setNewJob({...newJob, date: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Time</Label>
                            <Input value={newJob.time_slot} onChange={e => setNewJob({...newJob, time_slot: e.target.value})} className="col-span-3" placeholder="e.g. 09:00 AM" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">City</Label>
                            <Input value={newJob.city} onChange={e => setNewJob({...newJob, city: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Type</Label>
                             <Select value={newJob.status} onValueChange={(val) => setNewJob({...newJob, status: val})}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Survey">Site Survey</SelectItem>
                                    <SelectItem value="Install">Installation</SelectItem>
                                    <SelectItem value="Cleaning">Cleaning / Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddJob} className="bg-[#65A30D]">Save Schedule</Button>
                    </DialogFooter>
                </DialogContent>
           </Dialog>
        </div>
      </div>

      {/* SCHEDULE GRID */}
      {loading ? (
        <div className="flex justify-center items-center h-64 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading Schedule...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 min-h-150">
            {DAYS.map((day) => (
                <div key={day} className="flex flex-col gap-3">
                    {/* Day Header */}
                    <div className="p-3 text-center bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-slate-700 dark:text-slate-300">
                        {day}
                    </div>

                    {/* Job Cards Container */}
                    <div className="space-y-3 flex-1 p-2 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        {/* Filter jobs that match this day name */}
                        {jobs.filter(job => getDayName(job.date) === day).map(job => (
                            <div key={job.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm hover:border-[#65A30D] cursor-pointer transition-colors group relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full ${
                                    job.status === 'Install' ? 'bg-green-500' : 
                                    job.status === 'Survey' ? 'bg-blue-500' : 'bg-orange-500'
                                }`}></div>
                                
                                <div className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-[#65A30D] pl-2">{job.client_name}</div>
                                <div className="flex items-center gap-1 text-xs text-slate-500 mb-2 pl-2">
                                    <MapPin className="w-3 h-3" /> {job.city}
                                </div>
                                <div className="flex justify-between items-center text-xs pl-2">
                                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{job.team}</span>
                                    <span className="text-slate-400">{job.time_slot}</span>
                                </div>
                            </div>
                        ))}
                        
                        {jobs.filter(job => getDayName(job.date) === day).length === 0 && (
                            <div className="text-center text-xs text-slate-400 italic py-4">No Jobs</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}