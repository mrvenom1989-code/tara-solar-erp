// src/app/(admin)/inventory/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client"; // Import Supabase
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Filter, Package, AlertTriangle, ArrowDownToLine, History, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function InventoryPage() {
  const supabase = createClient();
  const [filter, setFilter] = useState("");
  const [items, setItems] = useState<any[]>([]); // Real Data State
  const [loading, setLoading] = useState(true);

  // 1. FETCH INVENTORY FROM DB
  useEffect(() => {
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

    fetchInventory();
  }, []);

  // 2. FILTER LOGIC
  const filteredItems = items.filter(item => 
    (item.name?.toLowerCase() || "").includes(filter.toLowerCase()) || 
    (item.category?.toLowerCase() || "").includes(filter.toLowerCase())
  );

  // 3. CALCULATE METRICS
  const lowStockCount = items.filter(i => i.stock < (i.min_level || 0)).length;
  // Note: Total Value calculation requires parsing the price string (e.g. "₹14,500" -> 14500). 
  // For now, we'll keep it simple or set a static value if specific parsing isn't added.

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
                 <div className="text-2xl font-bold">--</div>
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
                 <Button className="bg-[#65A30D] hover:bg-[#558b0b]"><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
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
                                                {/* Use min_level from DB */}
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
                                        <Button size="sm" variant="outline" className="mr-2">Restock</Button>
                                        <Button size="sm" variant="ghost">Edit</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
          </Card>
      </div>

    </div>
  );
}