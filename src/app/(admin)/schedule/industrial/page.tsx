// src/app/(admin)/schedule/industrial/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, HardHat, Loader2, Plus, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function IndustrialSchedulePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [projects, setProjects] = useState<any[]>([]); // For Dropdown
  const [tasks, setTasks] = useState<any[]>([]);       // For Gantt Chart
  const [teams, setTeams] = useState<any[]>([]);       // For Dropdown

  // UI States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
      project_id: "",
      task_name: "Civil Work",
      start_date: new Date().toISOString().split('T')[0],
      duration: "5", // Days
      team: "Team Alpha"
  });

  // 1. Calculate Days in Month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); 
  const daysInMonthCount = new Date(year, month + 1, 0).getDate();
  const daysInMonth = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // 2. FETCH DATA
  const fetchData = async () => {
      setLoading(true);
      
      // A. Fetch Active Industrial Projects (For Dropdown)
      const { data: projData } = await supabase
        .from('projects')
        .select('id, client_name')
        .eq('type', 'Industrial')
        .eq('status', 'In Progress');
      setProjects(projData || []);

      // B. Fetch Teams
      const { data: teamData } = await supabase.from('teams').select('name');
      setTeams(teamData || []);

      // C. Fetch Tasks (Stored in 'jobs' table with type='Industrial')
      const { data: tasksData } = await supabase
        .from('jobs')
        .select('*')
        .eq('type', 'Industrial'); 
      
      setTasks(tasksData || []);
      setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 3. HANDLE SAVE TASK
  const handleSaveTask = async () => {
      const selectedProj = projects.find(p => p.id.toString() === newTask.project_id);
      if(!selectedProj) return alert("Select a project");

      const { error } = await supabase.from('jobs').insert({
          client_name: selectedProj.client_name, // Store Project Name
          city: newTask.duration,                // Storing Duration in City field (Temporary reuse)
          date: newTask.start_date,
          team: newTask.team,
          status: newTask.task_name,             // Storing Task Name in Status field
          type: 'Industrial',                    // Mark as Industrial Task
          time_slot: "09:00 AM"                  // Default
      });

      if (!error) {
          setIsDialogOpen(false);
          fetchData();
      } else {
          alert("Error scheduling task: " + error.message);
      }
  };

  // 4. HELPER: Calculate Bar Position
  const getBarStyle = (startDateStr: string, durationStr: string) => {
    const startDate = new Date(startDateStr);
    const duration = parseInt(durationStr) || 1;
    
    let startDay = startDate.getDate();
    
    // Check overlap with current month
    if (startDate.getMonth() !== month || startDate.getFullYear() !== year) {
        if(startDate.getMonth() !== month) return { display: 'none' };
    }

    const endDay = Math.min(startDay + duration, daysInMonthCount);
    const widthDays = endDay - startDay; 

    // Calculate Percentages
    const leftPercent = ((startDay - 1) / daysInMonthCount) * 100;
    const widthPercent = Math.max((widthDays / daysInMonthCount) * 100, 3); // Min 3% width

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
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Industrial Schedule</h1>
           <p className="text-slate-500">{monthName} {year} - Project Gantt</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            {/* Fixed Class Here */}
            <Button variant="outline" className="min-w-25">{monthName}</Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* SCHEDULE TASK DIALOG */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-[#65A30D] text-white hover:bg-[#4d7c0f]">
                        <Plus className="w-4 h-4 mr-2"/> Schedule Task
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Schedule Project Task</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Project</Label>
                            <Select onValueChange={(v) => setNewTask({...newTask, project_id: v})}>
                                <SelectTrigger><SelectValue placeholder="Choose active project..." /></SelectTrigger>
                                <SelectContent>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.client_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Task Activity</Label>
                            <Select value={newTask.task_name} onValueChange={(v) => setNewTask({...newTask, task_name: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Civil Work">Civil Work / Piling</SelectItem>
                                    <SelectItem value="Structure">Structure Installation</SelectItem>
                                    <SelectItem value="Module Mounting">Module Mounting</SelectItem>
                                    <SelectItem value="Cabling">AC/DC Cabling</SelectItem>
                                    <SelectItem value="Commissioning">Testing & Commissioning</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input type="date" value={newTask.start_date} onChange={e => setNewTask({...newTask, start_date: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Duration (Days)</Label>
                                <Input type="number" min="1" value={newTask.duration} onChange={e => setNewTask({...newTask, duration: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Assign Team</Label>
                            <Select value={newTask.team} onValueChange={(v) => setNewTask({...newTask, team: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {teams.map(t => (
                                        <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveTask} className="bg-[#65A30D]">Save to Schedule</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* Monthly Gantt-style Grid */}
      <div className="border rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
        <div className="min-w-250"> 
            
            {/* Calendar Header Row */}
            <div className="grid grid-cols-[250px_1fr] border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-950 sticky top-0 z-10">
                <div className="p-4 font-bold text-slate-700 dark:text-slate-300 border-r dark:border-slate-800">
                    Project / Task
                </div>
                <div className="grid" style={{ gridTemplateColumns: `repeat(${daysInMonthCount}, minmax(30px, 1fr))` }}>
                    {daysInMonth.map(d => (
                        <div key={d} className="border-l dark:border-slate-800 py-2 text-center text-xs text-slate-500 font-medium">
                            {d}
                        </div>
                    ))}
                </div>
            </div>

            {/* Task Rows */}
            {loading ? (
                <div className="p-12 text-center text-slate-500 flex justify-center items-center">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Timeline...
                </div>
            ) : tasks.length === 0 ? (
                <div className="p-12 text-center text-slate-500 italic">
                    No tasks scheduled for {monthName}. Click "Schedule Task" to add one.
                </div>
            ) : (
                tasks.map((task) => {
                    const colorClass = 
                        task.status === 'Civil Work' ? "bg-orange-100 text-orange-700 border-orange-200" :
                        task.status === 'Structure' ? "bg-blue-100 text-blue-700 border-blue-200" :
                        task.status === 'Commissioning' ? "bg-green-100 text-green-700 border-green-200" :
                        "bg-purple-100 text-purple-700 border-purple-200";

                    return (
                        <div key={task.id} className="grid grid-cols-[250px_1fr] border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            {/* Project Title */}
                            <div className="p-4 border-r dark:border-slate-800">
                                <div className="font-semibold text-sm text-slate-900 dark:text-white truncate flex items-center gap-2">
                                    <HardHat className="w-4 h-4 text-slate-400"/> {task.client_name}
                                </div>
                                <div className="text-xs text-slate-500 mt-1 pl-6">{task.team}</div>
                            </div>
                            
                            {/* Timeline Grid */}
                            <div className="relative h-16 flex items-center">
                                {/* Grid Lines Background */}
                                <div className="absolute inset-0 grid h-full w-full" style={{ gridTemplateColumns: `repeat(${daysInMonthCount}, minmax(30px, 1fr))` }}>
                                    {daysInMonth.map(d => (
                                         <div key={d} className="h-full border-l dark:border-slate-800 pointer-events-none"></div>
                                    ))}
                                </div>
                                
                                {/* The Actual Bar */}
                                <div 
                                    className={`absolute h-10 rounded-md text-xs flex flex-col justify-center px-2 font-medium shadow-sm border z-10 ${colorClass}`}
                                    style={getBarStyle(task.date, task.city)} // city field holds duration
                                >
                                    <span className="truncate font-bold">{task.status}</span>
                                    <span className="truncate text-[10px] opacity-80">{task.city} Days</span>
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