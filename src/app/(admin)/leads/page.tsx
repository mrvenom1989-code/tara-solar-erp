// src/app/(admin)/leads/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Plus, Phone, FileText, Pencil, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LeadsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Data States
  const [editingLead, setEditingLead] = useState<any>(null);
  const [newLead, setNewLead] = useState({
      name: "",
      phone: "",
      city: "",
      capacity: "3",
      type: "Residential",
      status: "New"
  });

  // 1. FETCH LEADS
  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data);
    if (error) console.error("Error fetching leads:", error);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // 2. ADD NEW LEAD
  const handleAddLead = async () => {
    const { error } = await supabase.from('leads').insert([newLead]);
    if (!error) {
        setIsAddOpen(false);
        setNewLead({ name: "", phone: "", city: "", capacity: "3", type: "Residential", status: "New" }); // Reset
        fetchLeads(); // Refresh
    } else {
        alert("Error adding lead: " + error.message);
    }
  };

  // 3. UPDATE EXISTING LEAD
  const handleSaveLead = async () => {
    if (!editingLead) return;
    const { error } = await supabase
      .from('leads')
      .update({ 
          name: editingLead.name, 
          city: editingLead.city, 
          phone: editingLead.phone, 
          capacity: editingLead.capacity, 
          status: editingLead.status, 
          type: editingLead.type 
      })
      .eq('id', editingLead.id);

    if (!error) {
        setLeads((prev) => prev.map((l) => (l.id === editingLead.id ? editingLead : l)));
        setIsEditOpen(false);
    } else {
        alert("Failed to update lead");
    }
  };
  
  // 4. CONVERT TO PROJECT
  const handleConvertToProject = async (lead: any) => {
    // A. Insert into Projects
    const { error } = await supabase.from('projects').insert({
        client_name: lead.name,
        location: lead.city,
        capacity: Number(lead.capacity),
        type: lead.type,
        status: 'In Progress',
        stage: 'Site Survey',
        progress: 10
    });

    if (!error) {
        // B. Update Lead Status
        await supabase.from('leads').update({ status: 'Won' }).eq('id', lead.id);
        fetchLeads(); // Refresh list to show 'Won' status
        
        // C. Navigate to Projects
        if(confirm(`${lead.name} converted to Project! Go to Installations page?`)) {
            router.push("/installations");
        }
    } else {
        alert("Error converting to project: " + error.message);
    }
  };

  const handleEditClick = (lead: any) => {
    setEditingLead({ ...lead });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Leads CRM</h1>
           <p className="text-slate-500">Manage inquiries and convert them to customers.</p>
        </div>
        <div className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search leads..." 
                  className="pl-9 w-64" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button className="bg-[#65A30D] hover:bg-[#558b0b]" onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Lead
            </Button>
        </div>
      </div>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
            {loading ? (
                <div className="p-12 text-center text-slate-500 flex justify-center items-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5"/> Loading Leads...
                </div>
            ) : leads.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                    No leads found. Click "Add Lead" to create one.
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client Name</TableHead>
                            <TableHead>Requirement</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.filter(l => l.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((lead) => (
                            <TableRow key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                <TableCell className="font-medium">
                                    {lead.name}
                                    <div className="text-xs text-slate-500">{lead.city}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="mr-2">{lead.type}</Badge>
                                    {lead.capacity} kW
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Phone className="w-3 h-3" /> {lead.phone}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={
                                        lead.status === "New" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                                        lead.status === "Quote Sent" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" :
                                        lead.status === "Won" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                                        "bg-purple-100 text-purple-700 hover:bg-purple-100"
                                    }>
                                        {lead.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-2">
                                    
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEditClick(lead)}>
                                        <Pencil className="w-4 h-4 text-slate-500 hover:text-blue-600" />
                                    </Button>

                                    <Link href={lead.type === "Industrial" 
                                        ? `/documents/industrial-quote?client=${lead.name}&capacity=${lead.capacity}`
                                        : `/documents/residential-quote?client=${lead.name}&capacity=${lead.capacity}`
                                    }>
                                        <Button size="sm" variant="outline" className="h-8 border-slate-300 text-slate-600">
                                            <FileText className="w-3 h-3 mr-2" /> Quote
                                        </Button>
                                    </Link>

                                    {lead.status !== "Won" && (
                                        <Button 
                                            size="sm" 
                                            className="h-8 bg-[#65A30D] hover:bg-[#558b0b] text-white"
                                            onClick={() => handleConvertToProject(lead)}
                                        >
                                            Convert
                                        </Button>
                                    )}

                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

      {/* --- ADD LEAD DIALOG --- */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
         {/* Fixed: Updated sm:max-w-[500px] to sm:max-w-125 */}
         <DialogContent className="sm:max-w-125">
            <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Name</Label>
                    <Input value={newLead.name} onChange={(e) => setNewLead({...newLead, name: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Phone</Label>
                    <Input value={newLead.phone} onChange={(e) => setNewLead({...newLead, phone: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">City</Label>
                    <Input value={newLead.city} onChange={(e) => setNewLead({...newLead, city: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Capacity</Label>
                    <Input type="number" value={newLead.capacity} onChange={(e) => setNewLead({...newLead, capacity: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Type</Label>
                    <Select value={newLead.type} onValueChange={(val) => setNewLead({...newLead, type: val})}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Residential">Residential</SelectItem>
                            <SelectItem value="Industrial">Industrial</SelectItem>
                            <SelectItem value="Commercial">Commercial</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                 <Button onClick={handleAddLead} className="bg-[#65A30D]">Save Lead</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* --- EDIT LEAD DIALOG --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
         {/* Fixed: Updated sm:max-w-[500px] to sm:max-w-125 */}
         <DialogContent className="sm:max-w-125">
            <DialogHeader><DialogTitle>Edit Lead Details</DialogTitle></DialogHeader>
            {editingLead && (
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Name</Label>
                        <Input value={editingLead.name} onChange={(e) => setEditingLead({...editingLead, name: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Phone</Label>
                        <Input value={editingLead.phone} onChange={(e) => setEditingLead({...editingLead, phone: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">City</Label>
                        <Input value={editingLead.city} onChange={(e) => setEditingLead({...editingLead, city: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Capacity</Label>
                        <Input type="number" value={editingLead.capacity} onChange={(e) => setEditingLead({...editingLead, capacity: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Status</Label>
                        <Select value={editingLead.status} onValueChange={(val) => setEditingLead({...editingLead, status: val})}>
                            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="New">New</SelectItem>
                                <SelectItem value="Quote Sent">Quote Sent</SelectItem>
                                <SelectItem value="Won">Won</SelectItem>
                                <SelectItem value="Lost">Lost</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                 </div>
            )}
            <DialogFooter>
                 <Button onClick={handleSaveLead} className="bg-[#65A30D]">Save Changes</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

    </div>
  );
}