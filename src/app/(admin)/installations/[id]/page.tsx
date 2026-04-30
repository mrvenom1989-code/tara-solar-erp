// src/app/(admin)/installations/[id]/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calendar, CheckCircle2, MapPin, Ruler, User, Loader2, Save, Package, Plus, FileText, Upload, Download, Trash2, Pencil, X } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function InstallationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Edit States
  const [stage, setStage] = useState("");
  const [status, setStatus] = useState("");
  const [isEditIdOpen, setIsEditIdOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState("");
  const [savingId, setSavingId] = useState(false);

  // Material States
  const [materials, setMaterials] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [newMaterial, setNewMaterial] = useState({ itemId: "", quantity: "1" });
  const [addingMat, setAddingMat] = useState(false);

  // Document States
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("Site Plan");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Expense States
  const [expenses, setExpenses] = useState<any[]>([]);
  const [newExpense, setNewExpense] = useState({ description: "", amount: "", paymentTo: "" });
  const [addingExpense, setAddingExpense] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | number | null>(null);

  // FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch Project
      const { data: projData, error: projError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projError) {
        alert("Project not found!");
        router.push("/installations");
        return;
      }
      setProject(projData);
      setStage(projData.stage || (projData.type === 'Residential' ? 'Consumer Registration' : 'Site Survey'));
      setStatus(projData.status || "In Progress");

      // 2. Fetch Inventory (for dropdown)
      const { data: invData } = await supabase.from('inventory').select('*').gt('stock', 0);
      setInventory(invData || []);

      // 3. Fetch Allocated Materials
      fetchMaterials();

      // 4. Fetch Documents
      fetchDocuments();

      // 5. Fetch Expenses
      fetchExpenses();

      setLoading(false);
    };

    fetchData();
  }, [id, router]);

  const fetchMaterials = async () => {
      const { data } = await supabase.from('project_materials').select('*').eq('project_id', id).order('date_used', { ascending: false });
      setMaterials(data || []);
  };

  const fetchDocuments = async () => {
      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });
      
      if (!error) setDocuments(data || []);
  };

  const fetchExpenses = async () => {
      const { data, error } = await supabase
        .from('project_expenses')
        .select('*')
        .eq('project_id', id)
        .order('date', { ascending: false });
      
      if (!error) setExpenses(data || []);
  };

  const handleSaveProjectId = async () => {
      if (!editProjectId) {
          toast.error("Project ID cannot be empty");
          return;
      }
      
      setSavingId(true);
      
      // Check uniqueness
      const { data: existing } = await supabase
          .from('projects')
          .select('id')
          .eq('project_id', editProjectId)
          .neq('id', id)
          .single();
          
      if (existing) {
          toast.error("Project ID already exists! Please use a unique ID.");
          setSavingId(false);
          return;
      }
      
      const { error } = await supabase
          .from('projects')
          .update({ project_id: editProjectId })
          .eq('id', id);
          
      if (error) {
          toast.error("Error updating Project ID: " + error.message);
      } else {
          toast.success("Project ID updated successfully!");
          setProject((prev: any) => ({ ...prev, project_id: editProjectId }));
          setIsEditIdOpen(false);
      }
      setSavingId(false);
  };

  // UPDATE PROJECT STATUS
  const handleUpdate = async () => {
    setUpdating(true);
    let progress = 0;

    if (project.type === "Residential") {
      const residentialStages = [
        "Consumer Registration",
        "Application Submission",
        "Feasibility Approval",
        "Vendor Selection",
        "Upload Agreement",
        "Solar Installation Details",
        "Project Inspection",
        "Project Commissioning",
        "Subsidy Request",
        "Subsidy Disbursal"
      ];
      const stageIndex = residentialStages.indexOf(stage);
      progress = stageIndex >= 0 ? (stageIndex + 1) * 10 : 0;
    } else {
      if (stage === "Site Survey") progress = 10;
      if (stage === "Design") progress = 30;
      if (stage === "Material Dispatch") progress = 50;
      if (stage === "Installation") progress = 80;
      if (stage === "Net Metering") progress = 90;
      if (stage === "Completed") progress = 100;
    }

    const { error } = await supabase
      .from('projects')
      .update({ stage, status, progress: status === "Completed" ? 100 : progress })
      .eq('id', id);

    if (error) toast.error("Update failed: " + error.message);
    else {
        toast.success("Project updated successfully!");
        setProject((prev: any) => ({ ...prev, stage, status, progress }));
    }
    setUpdating(false);
  };

  const handleSaveExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      alert("Please enter a description and amount.");
      return;
    }
    setAddingExpense(true);

    let error;
    if (editingExpenseId) {
        const { error: updateError } = await supabase
            .from('project_expenses')
            .update({
                description: newExpense.description,
                amount: parseFloat(newExpense.amount),
                payment_to: newExpense.paymentTo
            })
            .eq('id', editingExpenseId);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('project_expenses')
            .insert({
                project_id: id,
                description: newExpense.description,
                amount: parseFloat(newExpense.amount),
                payment_to: newExpense.paymentTo,
                date: new Date().toISOString()
            });
        error = insertError;
    }

    if (error) {
        toast.error("Error saving expense: " + error.message);
    } else {
        fetchExpenses();
        handleCancelEdit();
    }
    setAddingExpense(false);
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    
    const { error } = await supabase.from('project_expenses').delete().eq('id', expenseId);
    if (error) {
        toast.error("Error deleting expense: " + error.message);
    } else {
        fetchExpenses();
        if (editingExpenseId === expenseId) handleCancelEdit();
    }
  };

  // ADD MATERIAL & DEDUCT STOCK
  const handleAddMaterial = async () => {
      if(!newMaterial.itemId || !newMaterial.quantity) return;
      setAddingMat(true);

      const selectedItem = inventory.find(i => i.id.toString() === newMaterial.itemId);
      const qty = parseInt(newMaterial.quantity);

      if(selectedItem.stock < qty) {
          alert("Not enough stock! Only " + selectedItem.stock + " available.");
          setAddingMat(false);
          return;
      }

      const { error: matError } = await supabase.from('project_materials').insert({
          project_id: id,
          item_name: selectedItem.name,
          quantity: qty,
          cost: parseFloat(selectedItem.price.replace(/[^0-9.]/g, '')) * qty 
      });

      if(!matError) {
          await supabase.from('inventory').update({ stock: selectedItem.stock - qty }).eq('id', selectedItem.id);
          fetchMaterials();
          setNewMaterial({ itemId: "", quantity: "1" });
          setInventory(prev => prev.map(i => i.id === selectedItem.id ? {...i, stock: i.stock - qty} : i));
          toast.success("Material allocated successfully!");
      } else {
          toast.error("Error adding material: " + matError.message);
      }
      setAddingMat(false);
  };

  // UPLOAD DOCUMENTS (supports multiple files)
  const handleUploadDocument = async () => {
      if (selectedFiles.length === 0) {
          toast.error("Please select at least one file to upload.");
          return;
      }

      setUploading(true);
      let successCount = 0;
      let failCount = 0;

      for (const file of selectedFiles) {
          // Clean filename to prevent URL issues
          const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileName = Date.now() + "_" + cleanName;
          const filePath = id + "/" + fileName;

          // 1. Upload to Supabase Storage
          const { error: uploadError } = await supabase
              .storage
              .from('project-files')
              .upload(filePath, file);

          if (uploadError) {
              failCount++;
              console.error("Upload error for", file.name, uploadError.message);
              continue;
          }

          // 2. Get Public URL
          const { data: { publicUrl } } = supabase
              .storage
              .from('project-files')
              .getPublicUrl(filePath);

          // 3. Save Record to Database
          const { error: dbError } = await supabase.from('project_documents').insert({
              project_id: id,
              name: file.name,
              type: docType,
              url: publicUrl
          });

          if (dbError) {
              failCount++;
              console.error("DB error for", file.name, dbError.message);
          } else {
              successCount++;
          }
      }

      // 4. Refresh & reset
      fetchDocuments();
      setSelectedFiles([]);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      if (successCount > 0 && failCount === 0) {
          toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully!`);
      } else if (successCount > 0 && failCount > 0) {
          toast.warning(`${successCount} uploaded, ${failCount} failed. Check console for details.`);
      } else {
          toast.error("All uploads failed. Please try again.");
      }

      setUploading(false);
  };

  // DELETE DOCUMENT (Storage + DB)
  const handleDeleteDocument = async (doc: any) => {
      if(!confirm("Are you sure you want to delete \"" + doc.name + "\"?")) return;

      // 1. Try delete from Storage (Parse path from URL)
      try {
          // Extracts path after 'project-files/'
          // URL format: .../storage/v1/object/public/project-files/[project_id]/[filename]
          const path = doc.url.split('/project-files/')[1];
          if(path) {
              await supabase.storage.from('project-files').remove([path]);
          }
      } catch (e) {
          console.error("Storage delete warning:", e);
          // Continue to delete from DB even if storage fails
      }

      // 2. Delete from Database
      const { error } = await supabase.from('project_documents').delete().eq('id', doc.id);

      if (error) {
          alert("Error removing document: " + error.message);
      } else {
          // Remove from local state immediately
          setDocuments(documents.filter(d => d.id !== doc.id));
      }
  };

  const handleEditExpense = (exp: any) => {
      setNewExpense({
          description: exp.description,
          amount: exp.amount.toString(),
          paymentTo: exp.payment_to || exp.paymentTo || ""
      });
      setEditingExpenseId(exp.id);
  };

  const handleCancelEdit = () => {
      setNewExpense({ description: "", amount: "", paymentTo: "" });
      setEditingExpenseId(null);
  };

  if (loading || !project) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#65A30D]" />
        </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="space-y-1">
             <Link href="/installations" className="text-slate-500 hover:text-slate-900 flex items-center gap-2 mb-2 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to List
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                {project.client_name}
                <Badge className={
                    project.status === 'Completed' ? "bg-green-100 text-green-700" :
                    project.status === 'On Hold' ? "bg-red-100 text-red-700" :
                    "bg-blue-100 text-blue-700"
                }>
                    {project.status}
                </Badge>
            </h1>
            <div className="text-slate-500 flex items-center gap-2">
                Project ID: {project.project_id || `#${project.id}`}
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700" onClick={() => {
                    setEditProjectId(project.project_id || "");
                    setIsEditIdOpen(true);
                }}>
                    <Pencil className="w-3 h-3" />
                </Button>
                • {project.location}
            </div>
        </div>
        
        <div className="flex gap-2">
            <Button className="bg-[#65A30D] hover:bg-[#558b0b]" onClick={handleUpdate} disabled={updating}>
                {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
            </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
           <TabsTrigger value="overview">Overview</TabsTrigger>
           <TabsTrigger value="materials">Materials</TabsTrigger>
           <TabsTrigger value="documents">Documents</TabsTrigger>
           <TabsTrigger value="expenses">Project Expense</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* LEFT COL: Project Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Project Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <MapPin className="w-4 h-4" /> Location
                                    </div>
                                    <div className="font-medium">{project.location || "N/A"}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Ruler className="w-4 h-4" /> Capacity
                                    </div>
                                    <div className="font-medium">{project.capacity} kW</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <User className="w-4 h-4" /> Type
                                    </div>
                                    <div className="font-medium">{project.type}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Calendar className="w-4 h-4" /> Created At
                                    </div>
                                    <div className="font-medium">{new Date(project.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Workflow Progress */}
                    <Card>
                        <CardHeader><CardTitle>Installation Progress</CardTitle></CardHeader>
                        <CardContent>
                            <div className="relative pt-4 pb-2">
                                <div className="flex mb-2 items-center justify-between text-xs font-semibold text-slate-600 uppercase">
                                    <span>0%</span>
                                    <span>Progress</span>
                                    <span>100%</span>
                                </div>
                                <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-slate-200">
                                    <div style={{ width: project.progress + '%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#65A30D] transition-all duration-1000"></div>
                                </div>
                            </div>

                            <div className="space-y-4 mt-6">
                                {(project.type === 'Residential' ? [
                                    "Consumer Registration",
                                    "Application Submission",
                                    "Feasibility Approval",
                                    "Vendor Selection",
                                    "Upload Agreement",
                                    "Solar Installation Details",
                                    "Project Inspection",
                                    "Project Commissioning",
                                    "Subsidy Request",
                                    "Subsidy Disbursal"
                                ] : ['Site Survey', 'Design', 'Material Dispatch', 'Installation', 'Net Metering', 'Completed']).map((s, i, arr) => {
                                    const isCompleted = arr.indexOf(project.stage) >= i;
                                    const isCurrent = project.stage === s;
                                    
                                    return (
                                        <div key={s} className="flex items-center gap-4">
                                            <div className={"w-8 h-8 rounded-full flex items-center justify-center border-2 " + (isCompleted || isCurrent ? 'bg-green-100 border-green-500 text-green-700' : 'bg-slate-50 border-slate-300 text-slate-300')}>
                                                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs">{i+1}</span>}
                                            </div>
                                            <span className={isCurrent ? "font-bold text-slate-900" : "text-slate-500"}>{s}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COL: Status Updates */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Update Status</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Current Stage</label>
                                <Select value={stage} onValueChange={setStage}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {project.type === 'Residential' ? (
                                            <>
                                                <SelectItem value="Consumer Registration">Consumer Registration</SelectItem>
                                                <SelectItem value="Application Submission">Application Submission</SelectItem>
                                                <SelectItem value="Feasibility Approval">Feasibility Approval</SelectItem>
                                                <SelectItem value="Vendor Selection">Vendor Selection</SelectItem>
                                                <SelectItem value="Upload Agreement">Upload Agreement</SelectItem>
                                                <SelectItem value="Solar Installation Details">Solar Installation Details</SelectItem>
                                                <SelectItem value="Project Inspection">Project Inspection</SelectItem>
                                                <SelectItem value="Project Commissioning">Project Commissioning</SelectItem>
                                                <SelectItem value="Subsidy Request">Subsidy Request</SelectItem>
                                                <SelectItem value="Subsidy Disbursal">Subsidy Disbursal</SelectItem>
                                            </>
                                        ) : (
                                            <>
                                                <SelectItem value="Site Survey">Site Survey</SelectItem>
                                                <SelectItem value="Design">Design</SelectItem>
                                                <SelectItem value="Material Dispatch">Material Dispatch</SelectItem>
                                                <SelectItem value="Installation">Installation</SelectItem>
                                                <SelectItem value="Net Metering">Net Metering</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Project Status</label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="On Hold">On Hold</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>

        {/* TAB 2: MATERIALS */}
        <TabsContent value="materials" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Add Material Form */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                             <Plus className="w-4 h-4"/> Add Material
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold">Select Item (Stock)</label>
                            <Select onValueChange={(val) => setNewMaterial({...newMaterial, itemId: val})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose inventory item..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {inventory.map(item => (
                                        <SelectItem key={item.id} value={item.id.toString()}>
                                            {item.name} ({item.stock} avail)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-bold">Quantity</label>
                             <Input 
                                type="number" 
                                min="1" 
                                value={newMaterial.quantity} 
                                onChange={e => setNewMaterial({...newMaterial, quantity: e.target.value})} 
                             />
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleAddMaterial} disabled={addingMat}>
                            {addingMat ? <Loader2 className="w-4 h-4 animate-spin"/> : "Allocate to Project"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Materials List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5"/> Allocated Materials
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Date Added</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {materials.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                                            No materials allocated yet.
                                        </TableCell>
                                    </TableRow>
                                ) : materials.map((mat) => (
                                    <TableRow key={mat.id}>
                                        <TableCell className="font-medium">{mat.item_name}</TableCell>
                                        <TableCell>{mat.quantity}</TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {new Date(mat.date_used).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        {/* TAB 3: DOCUMENTS */}
        <TabsContent value="documents" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Upload Card */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                             <Upload className="w-4 h-4"/> Upload Document
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold">Document Type</label>
                            <Select value={docType} onValueChange={setDocType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Site Plan">Site Plan / Drawing</SelectItem>
                                    <SelectItem value="Invoice">Commercial Invoice</SelectItem>
                                    <SelectItem value="Permission">Govt Permission / NOC</SelectItem>
                                    <SelectItem value="Photo">Site Photo</SelectItem>
                                    <SelectItem value="Contract">Signed Contract</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-bold">Select Files</label>
                             <Input
                                id="file-upload"
                                type="file"
                                multiple
                                className="cursor-pointer"
                                onChange={e => setSelectedFiles(e.target.files ? Array.from(e.target.files) : [])}
                             />
                             {selectedFiles.length > 1 && (
                                 <p className="text-xs text-slate-500">
                                     {selectedFiles.length} files selected
                                 </p>
                             )}
                        </div>
                        <Button className="w-full bg-[#65A30D] hover:bg-[#558b0b]" onClick={handleUploadDocument} disabled={uploading}>
                            {uploading
                                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading...</>
                                : <><Upload className="w-4 h-4 mr-2" /> Upload {selectedFiles.length > 1 ? `${selectedFiles.length} Files` : 'File'}</>
                            }
                        </Button>
                    </CardContent>
                </Card>

                {/* Documents List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5"/> Project Files
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>File Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Date Uploaded</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                            No documents uploaded yet.
                                        </TableCell>
                                    </TableRow>
                                ) : documents.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-slate-400"/> {doc.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{doc.type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {new Date(doc.created_at || doc.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-2">
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <Download className="w-4 h-4 text-blue-600"/>
                                                </Button>
                                            </a>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteDocument(doc)}>
                                                <Trash2 className="w-4 h-4 text-red-500"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        {/* TAB 4: EXPENSES */}
        <TabsContent value="expenses" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Add Expense Form */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                             {editingExpenseId ? <Pencil className="w-4 h-4"/> : <Plus className="w-4 h-4"/>} 
                             {editingExpenseId ? "Edit Expense" : "Add Expense"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                             <label className="text-sm font-bold">Description</label>
                             <Input 
                                placeholder="e.g. Travel, Food, etc."
                                value={newExpense.description} 
                                onChange={e => setNewExpense({...newExpense, description: e.target.value})} 
                             />
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-bold">Payment To</label>
                             <Input 
                                placeholder="e.g. John Doe"
                                value={newExpense.paymentTo} 
                                onChange={e => setNewExpense({...newExpense, paymentTo: e.target.value})} 
                             />
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-bold">Amount (₹)</label>
                             <Input 
                                type="number" 
                                placeholder="e.g. 500"
                                value={newExpense.amount} 
                                onChange={e => setNewExpense({...newExpense, amount: e.target.value})} 
                             />
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSaveExpense} disabled={addingExpense}>
                            {addingExpense ? <Loader2 className="w-4 h-4 animate-spin"/> : (editingExpenseId ? "Update Expense" : "Add Expense")}
                        </Button>
                        {editingExpenseId && (
                            <Button variant="outline" className="w-full" onClick={handleCancelEdit}>
                                <X className="w-4 h-4 mr-2"/> Cancel
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Expenses List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="w-5 h-5"/> Project Expenses
                            </div>
                            <div className="text-lg">
                                Total: <span className="font-bold text-green-600">₹{expenses.reduce((acc, exp) => acc + exp.amount, 0).toLocaleString()}</span>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Payment To</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                            No expenses recorded yet.
                                        </TableCell>
                                    </TableRow>
                                ) : expenses.map((exp) => (
                                    <TableRow key={exp.id}>
                                        <TableCell className="font-medium">{exp.description}</TableCell>
                                        <TableCell>{exp.payment_to || exp.paymentTo}</TableCell>
                                        <TableCell>₹{exp.amount.toLocaleString()}</TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {new Date(exp.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditExpense(exp)}>
                                                <Pencil className="w-4 h-4 text-blue-500"/>
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteExpense(exp.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

      </Tabs>

      {/* Edit Project ID Dialog */}
      <Dialog open={isEditIdOpen} onOpenChange={setIsEditIdOpen}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Edit Project ID</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Project ID</label>
                    <Input 
                        placeholder="e.g. PRJ-2024-001" 
                        value={editProjectId} 
                        onChange={(e) => setEditProjectId(e.target.value)} 
                    />
                </div>
            </div>
            <DialogFooter>
                 <Button variant="outline" onClick={() => setIsEditIdOpen(false)}>Cancel</Button>
                 <Button onClick={handleSaveProjectId} className="bg-[#65A30D] hover:bg-[#558b0b]" disabled={savingId}>
                     {savingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                     Save ID
                 </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
