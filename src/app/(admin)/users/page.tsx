// src/app/(admin)/users/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, User, Loader2, Pencil, KeyRound } from "lucide-react";
import { createNewUser, deleteUser, updateUser, resetUserPassword } from "@/app/actions/auth"; 

export default function UserManagementPage() {
  const supabase = createClient();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Form Data - Default role updated to "Sales"
  const [formData, setFormData] = useState({ id: 0, name: "", email: "", role: "Sales", status: "Active", password: "" });

  // 1. FETCH USERS
  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  // 2. CREATE USER
  const handleCreate = async () => {
    setActionLoading(true);
    const form = new FormData();
    form.append('name', formData.name);
    form.append('email', formData.email);
    form.append('role', formData.role);
    form.append('password', formData.password);

    const res = await createNewUser(null, form);
    if(res.success) {
        setIsAddOpen(false);
        fetchUsers();
        setFormData({ id: 0, name: "", email: "", role: "Sales", status: "Active", password: "" });
    } else {
        alert(res.message);
    }
    setActionLoading(false);
  };

  // 3. DELETE USER
  const handleDelete = async (email: string) => {
    if(!confirm("Are you sure? This deletes their login and data.")) return;
    
    const res = await deleteUser(email);
    if(res.success) fetchUsers();
    else alert(res.message);
  };

  // 4. UPDATE USER
  const handleUpdate = async () => {
    setActionLoading(true);
    
    // A. Update Profile Details
    const updateRes = await updateUser(formData.id, formData.name, formData.role, formData.status);
    if(!updateRes.success) {
        alert(updateRes.message);
        setActionLoading(false);
        return;
    }

    // B. Update Password (if provided)
    if(formData.password && formData.password.length > 0) {
        const passRes = await resetUserPassword(formData.email, formData.password);
        if(!passRes.success) alert("Profile updated, but password failed: " + passRes.message);
        else alert("User profile and password updated!");
    } else {
        alert("User profile updated!");
    }

    setIsEditOpen(false);
    fetchUsers();
    setActionLoading(false);
  };

  const openEdit = (user: any) => {
    setFormData({ ...user, password: "" }); // Clear password field for security
    setIsEditOpen(true);
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Management</h1>
           <p className="text-slate-500">Manage system access.</p>
        </div>
        
        <Button className="bg-[#65A30D] hover:bg-[#558b0b]" onClick={() => {
            setFormData({ id: 0, name: "", email: "", role: "Sales", status: "Active", password: "" });
            setIsAddOpen(true);
        }}>
            <Plus className="w-4 h-4 mr-2" /> Add Employee
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
             {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p>{user.name}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                                <TableCell>
                                    <Badge className={user.status === 'Active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button size="icon" variant="ghost" onClick={() => openEdit(user)}>
                                        <Pencil className="w-4 h-4 text-slate-500" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(user.email)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             )}
        </CardContent>
      </Card>

      {/* --- ADD DIALOG --- */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Name</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Email</Label>
                    <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Password</Label>
                    <Input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="col-span-3" placeholder="Initial Password" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Role</Label>
                    <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="Office">Office</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleCreate} disabled={actionLoading}>
                    {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- EDIT DIALOG --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Name</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Role</Label>
                    <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="Office">Office</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Status</Label>
                    <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                {/* PASSWORD RESET SECTION */}
                <div className="col-span-4 border-t pt-4 mt-2">
                    <p className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2">
                        <KeyRound className="w-4 h-4"/> Reset Password
                    </p>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-slate-500">New Pass</Label>
                        <Input 
                            type="text" 
                            placeholder="Leave empty to keep current" 
                            value={formData.password} 
                            onChange={e => setFormData({...formData, password: e.target.value})} 
                            className="col-span-3 border-dashed" 
                        />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleUpdate} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700">
                    {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Update User
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}