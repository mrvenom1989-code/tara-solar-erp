// src/app/(admin)/teams/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Plus, MapPin, Phone, Users, Truck, CalendarClock, Loader2, Pencil, Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function FieldTeamsPage() {
  const supabase = createClient();
  const [filter, setFilter] = useState("");
  const [teams, setTeams] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  // Add/Edit Crew State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null, // null for add, ID for edit
    name: "",
    leader: "",
    members: "3",
    contact: "",
    location: "Ahmedabad",
    specialty: "Residential",
    status: "Available"
  });

  // Assign Project State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");

  // 1. FETCH TEAMS
  const fetchTeams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) console.error("Error fetching teams:", error);
    else setTeams(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // 2. SAVE CREW (ADD OR EDIT)
  const handleSaveCrew = async () => {
    let error;
    
    if (formData.id) {
        // UPDATE
        const { error: updateError } = await supabase
            .from('teams')
            .update({
                name: formData.name,
                leader: formData.leader,
                members: formData.members,
                contact: formData.contact,
                location: formData.location,
                specialty: formData.specialty,
                status: formData.status
            })
            .eq('id', formData.id);
        error = updateError;
    } else {
        // INSERT
        // Remove 'id' from object
        const { id, ...newTeamData } = formData; 
        const { error: insertError } = await supabase.from('teams').insert([newTeamData]);
        error = insertError;
    }

    if (!error) {
        setIsDialogOpen(false);
        setFormData({ id: null, name: "", leader: "", members: "3", contact: "", location: "Ahmedabad", specialty: "Residential", status: "Available" });
        fetchTeams();
    } else {
        alert("Error saving team: " + error.message);
    }
  };

  const openEdit = (team: any) => {
      setFormData(team);
      setIsDialogOpen(true);
  };

  const openAdd = () => {
      setFormData({ id: null, name: "", leader: "", members: "3", contact: "", location: "Ahmedabad", specialty: "Residential", status: "Available" });
      setIsDialogOpen(true);
  };

  // 3. ASSIGN PROJECT LOGIC
  const openAssignDialog = async (team: any) => {
    setSelectedTeam(team);
    const { data } = await supabase
        .from('projects')
        .select('id, client_name, capacity, type')
        .eq('status', 'In Progress');
    
    setActiveProjects(data || []);
    setIsAssignOpen(true);
  };

  const handleAssignProject = async () => {
    if (!selectedProject || !selectedTeam) return;

    // A. Update Team Status
    const { error: teamError } = await supabase
        .from('teams')
        .update({ status: 'Deployed', location: `Site: Project #${selectedProject}` })
        .eq('id', selectedTeam.id);

    if (teamError) {
        alert("Error updating team: " + teamError.message);
        return;
    }

    alert(`Team ${selectedTeam.name} assigned successfully!`);
    setIsAssignOpen(false);
    fetchTeams();
  };

  // 4. UNASSIGN / RELEASE TEAM LOGIC
  const handleReleaseTeam = async (team: any) => {
      if(!confirm(`Mark ${team.name} as Available?`)) return;

      const { error } = await supabase
        .from('teams')
        .update({ status: 'Available', location: 'Ahmedabad' })
        .eq('id', team.id);
      
      if(!error) fetchTeams();
      else alert("Error releasing team: " + error.message);
  };

  // 5. STATS & FILTER
  const deployedCount = teams.filter(t => t.status === "Deployed").length;
  const availableCount = teams.filter(t => t.status === "Available").length;
  const onLeaveCount = teams.filter(t => t.status === "On Leave").length;

  const filteredTeams = teams.filter(t => 
    (t.name?.toLowerCase() || "").includes(filter.toLowerCase()) ||
    (t.leader?.toLowerCase() || "").includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Field Teams</h1>
           <p className="text-slate-500">Manage installation crews and assignments.</p>
        </div>
        <div className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search teams..." 
                  className="pl-9 w-64" 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            <Button className="bg-[#65A30D] hover:bg-[#558b0b]" onClick={openAdd}>
                <Plus className="w-4 h-4 mr-2" /> Add Crew
            </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Truck className="w-6 h-6"/></div>
                  <div>
                      <p className="text-xs font-bold uppercase text-blue-800">Deployed</p>
                      <p className="text-2xl font-bold text-blue-900">{deployedCount} Teams</p>
                  </div>
              </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-100">
              <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full text-green-600"><Users className="w-6 h-6"/></div>
                  <div>
                      <p className="text-xs font-bold uppercase text-green-800">Available</p>
                      <p className="text-2xl font-bold text-green-900">{availableCount} Team{availableCount !== 1 ? 's' : ''}</p>
                  </div>
              </CardContent>
          </Card>
          <Card className="bg-slate-50 border-slate-200">
              <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-slate-200 rounded-full text-slate-600"><CalendarClock className="w-6 h-6"/></div>
                  <div>
                      <p className="text-xs font-bold uppercase text-slate-600">On Leave</p>
                      <p className="text-2xl font-bold text-slate-700">{onLeaveCount} Team{onLeaveCount !== 1 ? 's' : ''}</p>
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading Field Teams...
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
             No teams found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredTeams.map((team) => (
               <Card key={team.id} className="hover:shadow-md transition-shadow group relative">
                  
                  {/* EDIT BUTTON (Top Right) */}
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-600"
                    onClick={() => openEdit(team)}
                  >
                      <Pencil className="w-4 h-4"/>
                  </Button>

                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex flex-col">
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                          <Badge variant="outline" className="w-fit mt-1 text-xs">{team.specialty}</Badge>
                      </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      
                      {/* Leader Info */}
                      <div className="flex items-center gap-3 pb-3 border-b">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                              {(team.leader || "U").charAt(0)}
                          </div>
                          <div>
                              <p className="text-sm font-medium">{team.leader}</p>
                              <p className="text-xs text-slate-500">{team.members} Technicians</p>
                          </div>
                          <Badge className={`ml-auto ${
                              team.status === "Available" ? "bg-green-100 text-green-700" :
                              team.status === "Deployed" ? "bg-blue-100 text-blue-700" :
                              "bg-slate-100 text-slate-600"
                          }`}>
                              {team.status}
                          </Badge>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2 text-slate-600">
                              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                              <span>{team.location || "No Location"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                              <Phone className="w-4 h-4" />
                              <span>{team.contact}</span>
                          </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 flex flex-col gap-2">
                          {team.status === "Available" ? (
                               <Button 
                                className="w-full bg-[#65A30D] hover:bg-[#558b0b]"
                                onClick={() => openAssignDialog(team)}
                               >
                                Assign Project
                               </Button>
                          ) : (
                               <div className="grid grid-cols-2 gap-2">
                                   <Link href={team.specialty === 'Industrial' ? '/schedule/industrial' : '/schedule/residential'} className="w-full">
                                      <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 text-xs px-2">
                                          <Calendar className="w-3 h-3 mr-1"/> Schedule
                                      </Button>
                                   </Link>
                                   <Button 
                                        variant="outline" 
                                        className="w-full border-green-200 text-green-700 hover:bg-green-50 text-xs px-2"
                                        onClick={() => handleReleaseTeam(team)}
                                   >
                                        <CheckCircle className="w-3 h-3 mr-1"/> Release
                                   </Button>
                               </div>
                          )}
                      </div>

                  </CardContent>
               </Card>
           ))}
        </div>
      )}

      {/* --- ADD / EDIT CREW DIALOG --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="sm:max-w-125">
            <DialogHeader>
                <DialogTitle>{formData.id ? "Edit Field Crew" : "Add New Field Crew"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Team Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="col-span-3" placeholder="e.g. Team Alpha" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Leader</Label>
                    <Input value={formData.leader} onChange={(e) => setFormData({...formData, leader: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Phone</Label>
                    <Input value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Members</Label>
                    <Input type="number" value={formData.members} onChange={(e) => setFormData({...formData, members: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Specialty</Label>
                    <Select value={formData.specialty} onValueChange={(val) => setFormData({...formData, specialty: val})}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Residential">Residential (Rooftop)</SelectItem>
                            <SelectItem value="Industrial">Industrial (Ground/HT)</SelectItem>
                            <SelectItem value="Maintenance">Maintenance (Cleaning)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Status</Label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Available">Available</SelectItem>
                            <SelectItem value="Deployed">Deployed</SelectItem>
                            <SelectItem value="On Leave">On Leave</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                 <Button onClick={handleSaveCrew} className="bg-[#65A30D]">Save Crew</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* --- ASSIGN PROJECT DIALOG --- */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
         <DialogContent className="sm:max-w-125">
            <DialogHeader><DialogTitle>Assign {selectedTeam?.name}</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
                <p className="text-sm text-slate-500">
                    Select an active project to deploy this {selectedTeam?.specialty} team to.
                </p>
                <div className="space-y-2">
                    <Label>Select Active Project</Label>
                    <Select onValueChange={setSelectedProject}>
                        <SelectTrigger><SelectValue placeholder="Choose a project..." /></SelectTrigger>
                        <SelectContent>
                            {activeProjects.map(p => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                    <span className="font-bold">{p.client_name}</span> 
                                    <span className="text-slate-400 ml-2">({p.capacity} kW - {p.type})</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                 <Button onClick={handleAssignProject} className="bg-blue-600 hover:bg-blue-700">Confirm Assignment</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

    </div>
  );
}