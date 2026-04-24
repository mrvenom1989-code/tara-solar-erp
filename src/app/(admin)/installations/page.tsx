// src/app/(admin)/installations/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client"; // Import Supabase
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Plus, MapPin, Zap, ArrowRight, Loader2, Trash2 } from "lucide-react";

export default function InstallationsListPage() {
  const supabase = createClient();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active"); // 'Active', 'Completed', 'All'
  const [projects, setProjects] = useState<any[]>([]); // State for Real Data
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // For Add Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProject, setNewProject] = useState({
      client_name: "",
      location: "",
      capacity: "3",
      type: "Residential"
  });

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

  // FETCH REAL DATA
  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDeleteProject = async (projectId: string) => {
    setDeleting(true);

    // 1. Fetch allocated materials so we can restock inventory
    const { data: materials } = await supabase
      .from('project_materials')
      .select('item_name, quantity')
      .eq('project_id', projectId);

    // 2. Restock inventory for each material used
    if (materials && materials.length > 0) {
      for (const mat of materials) {
        const { data: invItem } = await supabase
          .from('inventory')
          .select('id, stock')
          .eq('name', mat.item_name)
          .single();

        if (invItem) {
          await supabase
            .from('inventory')
            .update({ stock: invItem.stock + mat.quantity })
            .eq('id', invItem.id);
        }
      }
    }

    // 3. Delete child records (documents, expenses, materials)
    await supabase.from('project_documents').delete().eq('project_id', projectId);
    await supabase.from('project_expenses').delete().eq('project_id', projectId);
    await supabase.from('project_materials').delete().eq('project_id', projectId);

    // 4. Now delete the project itself
    const { error } = await supabase.from('projects').delete().eq('id', projectId);

    if (!error) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
    } else {
        alert("Error deleting installation: " + error.message);
    }
    setConfirmDeleteId(null);
    setDeleting(false);
  };

  const handleAddProject = async () => {
    const payload = {
        client_name: newProject.client_name,
        location: newProject.location,
        capacity: Number(newProject.capacity),
        type: newProject.type,
        status: 'In Progress',
        stage: newProject.type === 'Residential' ? 'Consumer Registration' : 'Site Survey',
        progress: 10
    };

    const { error } = await supabase.from('projects').insert([payload]);

    if (!error) {
        setIsAddOpen(false);
        setNewProject({ client_name: "", location: "", capacity: "3", type: "Residential" });
        fetchProjects(); // Refresh 
    } else {
        alert("Error adding installation: " + error.message);
    }
  };

  // Filter Logic
  const filteredProjects = projects.filter(p => {
    const matchesSearch = (p.client_name?.toLowerCase() || "").includes(filter.toLowerCase()) || 
                          (p.location?.toLowerCase() || "").includes(filter.toLowerCase());
    
    const isActive = p.status !== "Completed";
    
    if (statusFilter === "Active" && !isActive) return false;
    if (statusFilter === "Completed" && isActive) return false;
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Installations</h1>
           <p className="text-slate-500">Manage ongoing sites, timelines, and documentation.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search installations..." 
                  className="pl-9 w-64" 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Active">Active Only</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="All">All Projects</SelectItem>
                </SelectContent>
            </Select>
            <Button className="bg-[#65A30D] hover:bg-[#558b0b]" onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> New Installation
            </Button>
        </div>
      </div>

      {/* Projects Table View */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-20 text-slate-500">
               <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Projects...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
                No installations found matching your criteria.
            </div>
          ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Client & Location</TableHead>
                        <TableHead>System</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                   {filteredProjects.map((project) => (
                       <TableRow key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                           <TableCell>
                               <div className="font-bold text-slate-900 dark:text-white">{project.client_name}</div>
                               <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                   <MapPin className="w-3 h-3" /> {project.location || 'N/A'}
                               </div>
                           </TableCell>
                           <TableCell>
                               <Badge variant="outline" className="mr-2 mb-1">{project.type}</Badge>
                               <div className="text-sm font-semibold text-slate-700 flex items-center">
                                  <Zap className="w-3 h-3 text-[#F59E0B] mr-1" /> {project.capacity} kW
                               </div>
                           </TableCell>
                           <TableCell>
                               <Badge variant={project.status === "Completed" ? "default" : "outline"} className={
                                  project.status === "Completed" ? "bg-green-100 text-green-700 hover:bg-green-100 border-none" :
                                  project.status === "In Progress" ? "bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100" :
                                  "bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200"
                               }>
                                   {project.status === "Completed" ? "Completed" : project.stage}
                               </Badge>
                           </TableCell>
                           <TableCell className="w-[200px]">
                               <div className="flex justify-between text-xs text-slate-500 mb-1">
                                   <span>Progress</span>
                                   <span>{project.progress}%</span>
                               </div>
                               <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                   <div 
                                       className="h-full bg-[#65A30D] transition-all duration-500"
                                       style={{ width: `${project.progress || 0}%` }}
                                   ></div>
                               </div>
                           </TableCell>
                           <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {confirmDeleteId === project.id ? (
                                        <>
                                            <span className="text-xs text-red-600 font-medium">Are you sure?</span>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="h-7 text-xs px-2"
                                                onClick={() => handleDeleteProject(project.id)}
                                                disabled={deleting}
                                            >
                                                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes, Delete"}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs px-2"
                                                onClick={() => setConfirmDeleteId(null)}
                                                disabled={deleting}
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => setConfirmDeleteId(project.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <Link href={`/installations/${project.id}`}>
                                                <Button variant="ghost" className="h-8 text-[#65A30D] hover:text-[#558b0b] hover:bg-green-50">
                                                    Manage <ArrowRight className="ml-1 w-3 h-3" />
                                                </Button>
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </TableCell>
                       </TableRow>
                   ))}
                </TableBody>
             </Table>
          )}
        </CardContent>
      </Card>

      {/* --- ADD PROJECT DIALOG --- */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
         <DialogContent className="sm:max-w-125">
            <DialogHeader><DialogTitle>Add New Installation</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Client Name</Label>
                    <Input value={newProject.client_name} onChange={(e) => setNewProject({...newProject, client_name: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Location</Label>
                    <Input value={newProject.location} onChange={(e) => setNewProject({...newProject, location: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Capacity (kW)</Label>
                    <Input type="number" value={newProject.capacity} onChange={(e) => setNewProject({...newProject, capacity: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Type</Label>
                    <Select value={newProject.type} onValueChange={(val) => setNewProject({...newProject, type: val})}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Residential">Residential</SelectItem>
                            <SelectItem value="Industrial">Industrial</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                 <Button onClick={handleAddProject} className="bg-[#65A30D]">Create Installation</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

    </div>
  );
}