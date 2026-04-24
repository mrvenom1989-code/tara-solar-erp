// src/app/(admin)/inventory/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Plus, Package, AlertTriangle, ArrowDownToLine, History, Loader2, Trash2, Pencil, X, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const CATEGORIES = ["All", "Solar Panels", "Inverters", "Structures", "Cables", "Electrical"];
const LOCATIONS = ["Warehouse A", "Warehouse B", "Site Store"];

export default function InventoryPage() {
  const supabase = createClient();
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "", category: "Solar Panels", stock: "0",
    min_level: "10", price: "", location: "Warehouse A",
  });

  // Restock State
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState<any>(null);
  const [restockQty, setRestockQty] = useState("");
  const [restockNote, setRestockNote] = useState("");
  const [restocking, setRestocking] = useState(false);

  // Delete State
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Stock Logs State
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ── FETCH ──────────────────────────────────────────────
  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("name", { ascending: true });
    if (error) console.error("Error fetching inventory:", error);
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchInventory(); }, []);

  // ── ADD ITEM ───────────────────────────────────────────
  const openAdd = () => {
    setEditingItem(null);
    setFormData({ name: "", category: "Solar Panels", stock: "0", min_level: "10", price: "", location: "Warehouse A" });
    setIsAddOpen(true);
  };

  // ── EDIT ITEM ──────────────────────────────────────────
  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      stock: String(item.stock),
      min_level: String(item.min_level),
      price: item.price?.replace("₹", "") || "",
      location: item.location,
    });
    setIsAddOpen(true);
  };

  const handleSaveItem = async () => {
    if (!formData.name || !formData.price) {
      alert("Please fill in Item Name and Price.");
      return;
    }
    const stockNum = Number(formData.stock);
    const minNum = Number(formData.min_level);
    const payload = {
      name: formData.name,
      category: formData.category,
      stock: stockNum,
      min_level: minNum,
      price: formData.price.includes("₹") ? formData.price : `₹${formData.price}`,
      location: formData.location,
      status: stockNum > minNum ? "In Stock" : stockNum === 0 ? "Out of Stock" : "Low Stock",
    };

    let error;
    if (editingItem) {
      ({ error } = await supabase.from("inventory").update(payload).eq("id", editingItem.id));
    } else {
      ({ error } = await supabase.from("inventory").insert([payload]));
    }

    if (!error) {
      setIsAddOpen(false);
      fetchInventory();
    } else {
      alert("Error saving item: " + error.message);
    }
  };

  // ── RESTOCK (updates stock in-place, logs it) ──────────
  const openRestock = (item: any) => {
    setRestockTarget(item);
    setRestockQty("");
    setRestockNote("");
    setIsRestockOpen(true);
  };

  const handleRestock = async () => {
    if (!restockQty || parseInt(restockQty) <= 0) return alert("Enter a valid quantity");
    setRestocking(true);

    const addQty = parseInt(restockQty);
    const newStock = (restockTarget.stock || 0) + addQty;
    const newStatus = newStock > restockTarget.min_level ? "In Stock" : newStock === 0 ? "Out of Stock" : "Low Stock";

    // 1. Update inventory stock in-place (no new row created)
    const { error } = await supabase
      .from("inventory")
      .update({ stock: newStock, status: newStatus })
      .eq("id", restockTarget.id);

    if (error) {
      alert("Error restocking: " + error.message);
      setRestocking(false);
      return;
    }

    // 2. Write a log entry (fails silently if table doesn't exist yet)
    await supabase.from("inventory_logs").insert({
      inventory_id: restockTarget.id,
      item_name: restockTarget.name,
      type: "Inbound",
      quantity: addQty,
      note: restockNote || null,
      stock_after: newStock,
    });

    setIsRestockOpen(false);
    setRestocking(false);
    fetchInventory();
  };

  // ── DELETE ─────────────────────────────────────────────
  const handleDelete = async (itemId: number) => {
    setDeleting(true);
    // Delete logs first (FK if any), then item
    await supabase.from("inventory_logs").delete().eq("inventory_id", itemId);
    const { error } = await supabase.from("inventory").delete().eq("id", itemId);
    if (error) alert("Error deleting item: " + error.message);
    else setItems(prev => prev.filter(i => i.id !== itemId));
    setConfirmDeleteId(null);
    setDeleting(false);
  };

  // ── STOCK LOGS ─────────────────────────────────────────
  const openLogs = async () => {
    setIsLogsOpen(true);
    setLogsLoading(true);
    const { data, error } = await supabase
      .from("inventory_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error("Logs error:", error);
      setLogs([]);
    } else {
      setLogs(data || []);
    }
    setLogsLoading(false);
  };

  // ── FILTER ─────────────────────────────────────────────
  const filteredItems = items.filter(item => {
    const matchesSearch =
      (item.name?.toLowerCase() || "").includes(searchFilter.toLowerCase()) ||
      (item.location?.toLowerCase() || "").includes(searchFilter.toLowerCase());
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = items.filter(i => i.stock < (i.min_level || 0)).length;

  return (
    <div className="space-y-6">

      {/* 1. KEY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Package className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Total Items</span>
            </div>
            <div className="text-2xl font-bold">{items.length} SKUs</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-red-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" /> <span className="text-xs font-bold uppercase">Low Stock</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{lowStockCount} Items</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <ArrowDownToLine className="w-4 h-4 text-green-500" /> <span className="text-xs font-bold uppercase">In Stock</span>
            </div>
            <div className="text-2xl font-bold">{items.filter(i => i.status === "In Stock").length} Items</div>
          </CardContent>
        </Card>
        <Card
          className="border-slate-200 shadow-sm bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
          onClick={openLogs}
        >
          <CardContent className="p-4 flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-slate-600 font-bold">
              <History className="w-5 h-5" /> View Stock Logs
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. FILTERS + TABLE */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Warehouse Inventory</h2>

          <div className="flex flex-wrap gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search items..."
                className="pl-9 w-52"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button className="bg-[#65A30D] hover:bg-[#558b0b]" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-64 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading Inventory...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No items match your search/filter.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map(item => (
                    <TableRow key={item.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">
                        {item.name}
                        <div className="text-xs text-slate-400">Loc: {item.location}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="w-48">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{item.stock} units</span>
                            <span className="text-slate-400">Min: {item.min_level}</span>
                          </div>
                          <Progress
                            value={Math.min((item.stock / Math.max((item.min_level || 1) * 2, 1)) * 100, 100)}
                            className={`h-2 ${item.stock < item.min_level ? "bg-red-100" : "bg-green-100"}`}
                            indicatorClassName={item.stock < item.min_level ? "bg-red-500" : "bg-green-500"}
                          />
                        </div>
                      </TableCell>
                      <TableCell>{item.price}</TableCell>
                      <TableCell>
                        <Badge className={
                          item.status === "In Stock" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                          item.status === "Low Stock" ? "bg-orange-100 text-orange-700 hover:bg-orange-100" :
                          "bg-red-100 text-red-700 hover:bg-red-100"
                        }>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {confirmDeleteId === item.id ? (
                            <>
                              <span className="text-xs text-red-600 font-medium mr-1">Sure?</span>
                              <Button
                                variant="destructive" size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => handleDelete(item.id)}
                                disabled={deleting}
                              >
                                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
                              </Button>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm" variant="outline"
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => openRestock(item)}
                              >
                                <ArrowDownToLine className="w-3 h-3 mr-1" /> Restock
                              </Button>
                              <Button
                                size="sm" variant="ghost"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                                onClick={() => openEdit(item)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm" variant="ghost"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setConfirmDeleteId(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
      </div>

      {/* ── ADD / EDIT DIALOG ── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Category</Label>
              <Select value={formData.category} onValueChange={val => setFormData({ ...formData, category: val })}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter(c => c !== "All").map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Stock</Label>
              <Input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Min Level</Label>
              <Input type="number" value={formData.min_level} onChange={e => setFormData({ ...formData, min_level: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Price (₹)</Label>
              <Input placeholder="e.g. 14500" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Location</Label>
              <Select value={formData.location} onValueChange={val => setFormData({ ...formData, location: val })}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveItem} className="bg-[#65A30D] hover:bg-[#558b0b]">
              {editingItem ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── RESTOCK DIALOG ── */}
      <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Restock Item</DialogTitle></DialogHeader>
          {restockTarget && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 p-3 rounded border">
                <p className="font-bold text-sm">{restockTarget.name}</p>
                <p className="text-xs text-slate-500">Current Stock: <strong>{restockTarget.stock}</strong> units</p>
                <p className="text-xs text-slate-500">After Restock: <strong>{restockTarget.stock + (parseInt(restockQty) || 0)}</strong> units</p>
              </div>
              <div className="space-y-2">
                <Label>Quantity to Add</Label>
                <Input type="number" placeholder="e.g. 50" value={restockQty} onChange={e => setRestockQty(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Reference / PO Number (optional)</Label>
                <Input placeholder="e.g. PO-2026-001" value={restockNote} onChange={e => setRestockNote(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestockOpen(false)}>Cancel</Button>
            <Button onClick={handleRestock} className="bg-blue-600 hover:bg-blue-700" disabled={restocking}>
              {restocking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm Restock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── STOCK LOGS DIALOG ── */}
      <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Stock Movement Logs</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {logsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-10 text-slate-500 space-y-2">
                <History className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-medium">No stock logs yet</p>
                <p className="text-sm text-slate-400">
                  Logs will appear here after you restock items.<br />
                  <span className="text-orange-500 font-medium">Note:</span> You may need to create the <code className="bg-slate-100 px-1 rounded">inventory_logs</code> table in Supabase first.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Stock After</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-slate-500">{new Date(log.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium text-sm">{log.item_name}</TableCell>
                      <TableCell>
                        <Badge className={log.type === "Inbound" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell>+{log.quantity}</TableCell>
                      <TableCell>{log.stock_after}</TableCell>
                      <TableCell className="text-xs text-slate-500">{log.note || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}