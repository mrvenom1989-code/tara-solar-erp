// src/app/(admin)/schedule/residential/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MapPin, Loader2, Plus, Clock, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TIME_SLOTS = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"
];

export default function ResidentialSchedulePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]); // Store Teams for Dropdown
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Job Form State
  const initialJobState = {
    id: null, // null = new job, value = edit
    client_name: "",
    city: "",
    date: new Date().toISOString().split('T')[0], // Default today
    time_slot: "09:00 AM",
    team: "",
    status: "Survey"
  };
  const [formData, setFormData] = useState(initialJobState);

  // 1. FETCH DATA (Jobs & Teams)
  const fetchData = async () => {
    setLoading(true);
    
    // A. Fetch Jobs - FILTERED BY TYPE
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('type', 'Residential') // CRITICAL FIX: Only show Residential jobs
      .order('date', { ascending: true });
    
    if (jobsError) console.error("Error fetching jobs:", jobsError);
    else setJobs(jobsData || []);

    // B. Fetch Teams
    const { data: teamsData } = await supabase.from('teams').select('name').eq('status', 'Available');
    if(teamsData) setTeams(teamsData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. SAVE JOB (Add or Update)
  const handleSaveJob = async () => {
    setIsSaving(true);
    
    // Validation
    if(!formData.client_name || !formData.team) {
        alert("Please enter Client Name and select a Team.");
        setIsSaving(false);
        return;
    }

    let error;
    
    if (formData.id) {
        // UPDATE Existing
        const { error: updateError } = await supabase
            .from('jobs')
            .update({
                client_name: formData.client_name,
                city: formData.city,
                date: formData.date,
                time_slot: formData.time_slot,
                team: formData.team,
                status: formData.status
            })
            .eq('id', formData.id);
        error = updateError;
    } else {
        // INSERT New
        const { id, ...newJobData } = formData; 
        const { error: insertError } = await supabase.from('jobs').insert([{
            ...newJobData,
            type: 'Residential' // Ensure new jobs are marked correctly
        }]);
        error = insertError;
    }

    if (!error) {
        setIsDialogOpen(false);
        fetchData(); // Refresh list
        setFormData(initialJobState); // Reset
    } else {
        alert("Error saving job: " + error.message);
    }
    setIsSaving(false);
  };

  // 3. OPEN EDIT DIALOG
  const handleEditClick = (job: any) => {
      setFormData(job);
      setIsDialogOpen(true);
  };

  // 4. OPEN ADD DIALOG
  const handleAddClick = () => {
      setFormData(initialJobState);
      setIsDialogOpen(true);
  }

  // Helper: Get Day Name
  const getDayName = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Helper: Sort jobs by time index
  const sortJobsByTime = (jobList: any[]) => {
      return jobList.sort((a, b) => {
          const idxA = TIME_SLOTS.indexOf(a.time_slot);
          const idxB = TIME_SLOTS.indexOf(b.time_slot);
          return idxA - idxB;
      });
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
           
           {/* ADD JOB BUTTON */}
           <Button className="bg-[#65A30D] text-white hover:bg-[#4d7c0f]" onClick={handleAddClick}>
               <Plus className="w-4 h-4 mr-2"/> Add Job
           </Button>
        </div>
      </div>

      {/* SCHEDULE GRID */}
      {loading ? (
        <div className="flex justify-center items-center h-64 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading Schedule...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 min-h-150">
            {DAYS.map((day) => {
                // Filter jobs for this day
                const dayJobs = jobs.filter(job => getDayName(job.date) === day);
                // Sort them by time slot
                const sortedJobs = sortJobsByTime(dayJobs);

                return (
                    <div key={day} className="flex flex-col gap-3">
                        {/* Day Header */}
                        <div className="p-3 text-center bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-slate-700 dark:text-slate-300">
                            {day}
                        </div>

                        {/* Job Cards Container */}
                        <div className="space-y-3 flex-1 p-2 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            {sortedJobs.map(job => (
                                <div 
                                    key={job.id} 
                                    onClick={() => handleEditClick(job)} // CLICK TO EDIT
                                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm hover:border-[#65A30D] cursor-pointer transition-all hover:shadow-md group relative overflow-hidden"
                                >
                                    <div className={`absolute top-0 left-0 w-1 h-full ${
                                        job.status === 'Install' ? 'bg-green-500' : 
                                        job.status === 'Survey' ? 'bg-blue-500' : 'bg-orange-500'
                                    }`}></div>
                                    
                                    <div className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-[#65A30D] pl-2 truncate">
                                        {job.client_name}
                                    </div>
                                    
                                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-2 pl-2 truncate">
                                        <MapPin className="w-3 h-3 shrink-0" /> {job.city}
                                    </div>
                                    
                                    <div className="flex flex-wrap justify-between items-center gap-1 text-xs pl-2 border-t pt-2 mt-1">
                                        <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                            <Users className="w-3 h-3"/> {job.team}
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-500 font-medium">
                                            <Clock className="w-3 h-3"/> {job.time_slot}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {sortedJobs.length === 0 && (
                                <div className="text-center text-xs text-slate-400 italic py-4">No Jobs</div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
      )}

      {/* --- ADD / EDIT JOB DIALOG --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{formData.id ? "Edit Job" : "Schedule New Job"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Client</Label>
                        <Input 
                            value={formData.client_name} 
                            onChange={e => setFormData({...formData, client_name: e.target.value})} 
                            className="col-span-3" 
                            placeholder="e.g. Patel Villa" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Date</Label>
                        <Input 
                            type="date" 
                            value={formData.date} 
                            onChange={e => setFormData({...formData, date: e.target.value})} 
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Time</Label>
                        <Select value={formData.time_slot} onValueChange={(val) => setFormData({...formData, time_slot: val})}>
                            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                            <SelectContent className="max-h-48">
                                {TIME_SLOTS.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">City</Label>
                        <Input 
                            value={formData.city} 
                            onChange={e => setFormData({...formData, city: e.target.value})} 
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Team</Label>
                        <Select value={formData.team} onValueChange={(val) => setFormData({...formData, team: val})}>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Team" /></SelectTrigger>
                            <SelectContent>
                                {teams.length === 0 && <SelectItem value="Team Alpha">Team Alpha (Default)</SelectItem>}
                                {teams.map(t => (
                                    <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Type</Label>
                        <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
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
                    <Button onClick={handleSaveJob} className="bg-[#65A30D]" disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : (formData.id ? "Update Job" : "Save Job")}
                    </Button>
                </DialogFooter>
            </DialogContent>
       </Dialog>

    </div>
  );
}