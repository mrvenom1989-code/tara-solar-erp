// src/app/(admin)/teams/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Plus, MapPin, Phone, Users, Truck, CalendarClock, Loader2, Pencil, Calendar, CheckCircle, Trash2, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function FieldTeamsPage() {
  const supabase = createClient();
  const [filter, setFilter] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCrew, setSavingCrew] = useState(false);

  // Delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add/Edit Crew State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null as any,
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
      .from("teams")
      .select("*")
      .order("name", { ascending: true });

    if (error) console.error("Error fetching teams:", error);
    else setTeams(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTeams(); }, []);

  // 2. SAVE CREW (ADD OR EDIT)
  const handleSaveCrew = async () => {
    if (!formData.name || !formData.leader) {
      toast.error("Please enter Team Name and Leader.");
      return;
    }
    setSavingCrew(true);
    let error;

    if (formData.id) {
      const { error: updateError } = await supabase
        .from("teams")
        .update({
          name: formData.name,
          leader: formData.leader,
          members: formData.members,
          contact: formData.contact,
          location: formData.location,
          specialty: formData.specialty,
          status: formData.status
        })
        .eq("id", formData.id);
      error = updateError;
    } else {
      const { id, ...newTeamData } = formData;
      const { error: insertError } = await supabase.from("teams").insert([newTeamData]);
      error = insertError;
    }

    if (!error) {
      setIsDialogOpen(false);
      setFormData({ id: null, name: "", leader: "", members: "3", contact: "", location: "Ahmedabad", specialty: "Residential", status: "Available" });
      fetchTeams();
      toast.success(formData.id ? "Team updated!" : "Team added!");
    } else {
      toast.error("Error saving team: " + error.message);
    }
    setSavingCrew(false);
  };

  const openEdit = (team: any) => {
    setFormData(team);
    setIsDialogOpen(true);
  };

  const openAdd = () => {
    setFormData({ id: null, name: "", leader: "", members: "3", contact: "", location: "Ahmedabad", specialty: "Residential", status: "Available" });
    setIsDialogOpen(true);
  };

  // 3. DELETE TEAM
  const handleDeleteTeam = async (teamId: number) => {
    setDeleting(true);
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (!error) {
      setTeams(prev => prev.filter(t => t.id !== teamId));
      toast.success("Team deleted.");
    } else {
      toast.error("Error deleting team: " + error.message);
    }
    setConfirmDeleteId(null);
    setDeleting(false);
  };

  // 4. ASSIGN PROJECT LOGIC
  const openAssignDialog = async (team: any) => {
    setSelectedTeam(team);
    const { data } = await supabase
      .from("projects")
      .select("id, client_name, capacity, type")
      .eq("status", "In Progress");
    setActiveProjects(data || []);
    setIsAssignOpen(true);
  };

  const handleAssignProject = async () => {
    if (!selectedProject || !selectedTeam) return;
    const { error } = await supabase
      .from("teams")
      .update({ status: "Deployed", location: `Site: Project #${selectedProject}` })
      .eq("id", selectedTeam.id);

    if (error) {
      toast.error("Error assigning team: " + error.message);
      return;
    }
    toast.success(`${selectedTeam.name} assigned successfully!`);
    setIsAssignOpen(false);
    fetchTeams();
  };

  // 5. RELEASE TEAM
  const handleReleaseTeam = async (team: any) => {
    const { error } = await supabase
      .from("teams")
      .update({ status: "Available" })
      .eq("id", team.id);
    if (!error) { fetchTeams(); toast.success(`${team.name} marked as Available.`); }
    else toast.error("Error releasing team: " + error.message);
  };

  // 6. STATS & FILTER
  const deployedCount = teams.filter(t => t.status === "Deployed").length;
  const availableCount = teams.filter(t => t.status === "Available").length;
  const onLeaveCount = teams.filter(t => t.status === "On Leave").length;

  const filteredTeams = teams.filter(t =>
    (t.name?.toLowerCase() || "").includes(filter.toLowerCase()) ||
    (t.leader?.toLowerCase() || "").includes(filter.toLowerCase()) ||
    (t.specialty?.toLowerCase() || "").includes(filter.toLowerCase())
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
              onChange={e => setFilter(e.target.value)}
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
            <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Truck className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold uppercase text-blue-800">Deployed</p>
              <p className="text-2xl font-bold text-blue-900">{deployedCount} Teams</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold uppercase text-green-800">Available</p>
              <p className="text-2xl font-bold text-green-900">{availableCount} Team{availableCount !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-slate-200 rounded-full text-slate-600"><CalendarClock className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-600">On Leave</p>
              <p className="text-2xl font-bold text-slate-700">{onLeaveCount} Team{onLeaveCount !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading Field Teams...
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No teams found matching your search.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map(team => (
                  <TableRow key={team.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">

                    {/* Team Name + members */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm shrink-0">
                          {(team.name || "T").charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{team.name}</div>
                          <div className="text-xs text-slate-400">{team.members} technicians</div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Leader */}
                    <TableCell className="text-sm text-slate-700">{team.leader || "—"}</TableCell>

                    {/* Specialty */}
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{team.specialty}</Badge>
                    </TableCell>

                    {/* Contact */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Phone className="w-3 h-3" /> {team.contact || "—"}
                      </div>
                    </TableCell>

                    {/* Location */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[140px]">{team.location || "—"}</span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge className={
                        team.status === "Available" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                        team.status === "Deployed"  ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                        "bg-slate-100 text-slate-600 hover:bg-slate-100"
                      }>
                        {team.status}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {confirmDeleteId === team.id ? (
                          <>
                            <span className="text-xs text-red-600 font-medium mr-1">Sure?</span>
                            <Button
                              variant="destructive" size="sm" className="h-7 text-xs px-2"
                              onClick={() => handleDeleteTeam(team.id)} disabled={deleting}
                            >
                              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
                            </Button>
                            <Button
                              variant="ghost" size="sm" className="h-7 text-xs px-2"
                              onClick={() => setConfirmDeleteId(null)} disabled={deleting}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            {/* Edit */}
                            <Button
                              size="sm" variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
                              onClick={() => openEdit(team)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>

                            {/* Delete */}
                            <Button
                              size="sm" variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setConfirmDeleteId(team.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>

                            {/* Assign / Release */}
                            {team.status === "Available" ? (
                              <Button
                                size="sm"
                                className="h-8 bg-[#65A30D] hover:bg-[#558b0b] text-white"
                                onClick={() => openAssignDialog(team)}
                              >
                                Assign
                              </Button>
                            ) : (
                              <div className="flex gap-1">
                                <Link href={team.specialty === "Industrial" ? "/schedule/industrial" : "/schedule/residential"}>
                                  <Button size="sm" variant="outline" className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs px-2">
                                    <Calendar className="w-3 h-3 mr-1" /> Schedule
                                  </Button>
                                </Link>
                                <Button
                                  size="sm" variant="outline"
                                  className="h-8 border-green-200 text-green-700 hover:bg-green-50 text-xs px-2"
                                  onClick={() => handleReleaseTeam(team)}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" /> Release
                                </Button>
                              </div>
                            )}
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

      {/* --- ADD / EDIT CREW DIALOG --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{formData.id ? "Edit Field Crew" : "Add New Field Crew"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Team Name</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="col-span-3" placeholder="e.g. Team Alpha" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Leader</Label>
              <Input value={formData.leader} onChange={e => setFormData({ ...formData, leader: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Phone</Label>
              <Input value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Members</Label>
              <Input type="number" value={formData.members} onChange={e => setFormData({ ...formData, members: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Specialty</Label>
              <Select value={formData.specialty} onValueChange={val => setFormData({ ...formData, specialty: val })}>
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
              <Select value={formData.status} onValueChange={val => setFormData({ ...formData, status: val })}>
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCrew} className="bg-[#65A30D] hover:bg-[#558b0b]" disabled={savingCrew}>
              {savingCrew ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Crew
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- ASSIGN PROJECT DIALOG --- */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Assign {selectedTeam?.name}</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-500">
              Select an active project to deploy this <strong>{selectedTeam?.specialty}</strong> team to.
            </p>
            <div className="space-y-2">
              <Label>Select Active Project</Label>
              <Select onValueChange={setSelectedProject}>
                <SelectTrigger><SelectValue placeholder="Choose a project..." /></SelectTrigger>
                <SelectContent>
                  {activeProjects.length === 0 ? (
                    <SelectItem value="none" disabled>No active projects</SelectItem>
                  ) : (
                    activeProjects.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        <span className="font-bold">{p.client_name}</span>
                        <span className="text-slate-400 ml-2">({p.capacity} kW — {p.type})</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignProject} className="bg-blue-600 hover:bg-blue-700" disabled={!selectedProject}>
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}