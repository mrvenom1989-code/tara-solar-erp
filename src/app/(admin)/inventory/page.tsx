// src/app/(admin)/inventory/page.tsx
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
import { Search, Plus, Filter, Package, AlertTriangle, ArrowDownToLine, History, Loader2, ArrowUpRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function InventoryPage() {
  const supabase = createClient();
  const [filter, setFilter] = useState("");
  const [items, setItems] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  // Add Item State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({
      name: "",
      category: "Solar Panels",
      stock: "0",
      min_level: "10",
      price: "",
      location: "Warehouse A",
      status: "In Stock"
  });

  // Restock State
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [restockQty, setRestockQty] = useState("");
  const [restockNote, setRestockNote] = useState("");

  // 1. FETCH INVENTORY FROM DB
  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error("Error fetching inventory:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // 2. ADD ITEM LOGIC
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) {
        alert("Please fill in the Item Name and Price.");
        return;
    }

    const { error } = await supabase.from('inventory').insert([{
        name: newItem.name,
        category: newItem.category,
        stock: Number(newItem.stock),
        min_level: Number(newItem.min_level),
        price: newItem.price.includes("₹") ? newItem.price : `₹${newItem.price}`,
        location: newItem.location,
        status: Number(newItem.stock) > Number(newItem.min_level) ? 'In Stock' : 'Low Stock'
    }]);

    if (!error) {
        setIsAddOpen(false);
        setNewItem({ name: "", category: "Solar Panels", stock: "0", min_level: "10", price: "", location: "Warehouse A", status: "In Stock" }); 
        fetchInventory();
    } else {
        alert("Error adding item: " + error.message);
    }
  };

  // 3. RESTOCK LOGIC (INBOUND)
  const openRestock = (item: any) => {
      setSelectedItem(item);
      setRestockQty("");
      setRestockNote("");
      setIsRestockOpen(true);
  };

  const handleRestock = async () => {
      if (!restockQty || parseInt(restockQty) <= 0) return alert("Enter valid quantity");
      
      const newStock = (selectedItem.stock || 0) + parseInt(restockQty);
      
      // Update Database
      const { error } = await supabase
          .from('inventory')
          .update({ 
              stock: newStock,
              status: newStock > selectedItem.min_level ? 'In Stock' : 'Low Stock'
          })
          .eq('id', selectedItem.id);

      if (!error) {
          setIsRestockOpen(false);
          fetchInventory();
      } else {
          alert("Error restocking: " + error.message);
      }
  };

  // 4. FILTER & METRICS
  const filteredItems = items.filter(item => 
    (item.name?.toLowerCase() || "").includes(filter.toLowerCase()) || 
    (item.category?.toLowerCase() || "").includes(filter.toLowerCase())
  );

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
                     <AlertTriangle className="w-4 h-4 text-red-500" /> <span className="text-xs font-bold uppercase">Low Stock Items</span>
                 </div>
                 <div className="text-2xl font-bold text-red-600">{lowStockCount} Items</div>
             </CardContent>
          </Card>
          <Card className="border-l-4 border-green-500 shadow-sm">
             <CardContent className="p-4">
                 <div className="flex items-center gap-2 text-slate-500 mb-1">
                     <ArrowDownToLine className="w-4 h-4 text-green-500" /> <span className="text-xs font-bold uppercase">Inbound Orders</span>
                 </div>
                 <div className="text-2xl font-bold">Active</div>
             </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm bg-slate-50">
             <CardContent className="p-4 flex items-center justify-center h-full cursor-pointer hover:bg-slate-100 transition-colors">
                 <div className="flex items-center gap-2 text-slate-600 font-bold">
                     <History className="w-5 h-5" /> View Stock Logs
                 </div>
             </CardContent>
          </Card>
      </div>

      {/* 2. INVENTORY TABLE */}
      <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Warehouse Inventory</h2>
             
             <div className="flex gap-2">
                 <div className="relative">
                     <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                     <Input 
                       placeholder="Search items..." 
                       className="pl-9 w-64" 
                       value={filter}
                       onChange={(e) => setFilter(e.target.value)}
                     />
                 </div>
                 <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
                 
                 <Button className="bg-[#65A30D] hover:bg-[#558b0b]" onClick={() => setIsAddOpen(true)}>
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
                        No items found in inventory.
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
                            {filteredItems.map((item) => (
                                <TableRow key={item.id} className="hover:bg-slate-50">
                                    <TableCell className="font-medium">
                                        {item.name}
                                        <div className="text-xs text-slate-400">Loc: {item.location}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">{item.category}</Badge>
                                    </TableCell>
                                    <TableCell className="w-50">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>{item.stock} units</span>
                                                <span className="text-slate-400">Min: {item.min_level}</span>
                                            </div>
                                            <Progress 
                                                value={(item.stock / ((item.min_level || 1) * 2)) * 100} 
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
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="mr-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                            onClick={() => openRestock(item)}
                                        >
                                            <ArrowDownToLine className="w-3 h-3 mr-1"/> Restock
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
          </Card>
      </div>

      {/* --- ADD ITEM DIALOG --- */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
         <DialogContent className="sm:max-w-125">
            <DialogHeader><DialogTitle>Add New Inventory Item</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Name</Label>
                    <Input value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Category</Label>
                    <Select value={newItem.category} onValueChange={(val) => setNewItem({...newItem, category: val})}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Solar Panels">Solar Panels</SelectItem>
                            <SelectItem value="Inverters">Inverters</SelectItem>
                            <SelectItem value="Structures">Structures</SelectItem>
                            <SelectItem value="Cables">Cables</SelectItem>
                            <SelectItem value="Electrical">Electrical</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Stock</Label>
                    <Input type="number" value={newItem.stock} onChange={(e) => setNewItem({...newItem, stock: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Min Level</Label>
                    <Input type="number" value={newItem.min_level} onChange={(e) => setNewItem({...newItem, min_level: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Price</Label>
                    <Input placeholder="e.g. 14500" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Location</Label>
                    <Select value={newItem.location} onValueChange={(val) => setNewItem({...newItem, location: val})}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Warehouse A">Warehouse A (Main)</SelectItem>
                            <SelectItem value="Warehouse B">Warehouse B (Spares)</SelectItem>
                            <SelectItem value="Site Store">Site Store</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                 <Button onClick={handleAddItem} className="bg-[#65A30D]">Save Item</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* --- RESTOCK DIALOG --- */}
      <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
         {/* Fixed Class Here */}
         <DialogContent className="sm:max-w-100">
            <DialogHeader><DialogTitle>Restock Item</DialogTitle></DialogHeader>
            {selectedItem && (
                <div className="space-y-4 py-2">
                    <div className="bg-slate-50 p-3 rounded border">
                        <p className="font-bold text-sm">{selectedItem.name}</p>
                        <p className="text-xs text-slate-500">Current Stock: {selectedItem.stock} units</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Quantity to Add</Label>
                        <Input 
                            type="number" 
                            placeholder="e.g. 50" 
                            value={restockQty} 
                            onChange={e => setRestockQty(e.target.value)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Reference / PO Number</Label>
                        <Input 
                            placeholder="e.g. PO-2026-001" 
                            value={restockNote} 
                            onChange={e => setRestockNote(e.target.value)} 
                        />
                    </div>
                </div>
            )}
            <DialogFooter>
                 <Button onClick={handleRestock} className="bg-blue-600 hover:bg-blue-700 w-full">
                     Confirm Inbound
                 </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

    </div>
  );
}