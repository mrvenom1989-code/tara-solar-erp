// src/app/(admin)/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { IndianRupee, TrendingUp, Users, Zap, Loader2, Calendar, Filter } from "lucide-react";

export default function ReportsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  
  // Date Filter States
  const [dateFilter, setDateFilter] = useState("30_days"); // Default
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Data States
  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(""); 

  // 1. FETCH DATA
  const fetchData = async () => {
      setLoading(true);
      
      let start = new Date('2000-01-01').toISOString();
      let end = new Date().toISOString(); // Now

      const now = new Date();

      if (dateFilter === '30_days') {
         const d = new Date(); d.setDate(d.getDate() - 30);
         start = d.toISOString();
      } else if (dateFilter === 'this_year') {
         start = new Date(now.getFullYear(), 0, 1).toISOString();
      } else if (dateFilter === 'custom') {
         if (customStart) start = new Date(customStart).toISOString();
         if (customEnd) {
            // Set end date to end of that day (23:59:59)
            const e = new Date(customEnd);
            e.setHours(23, 59, 59, 999);
            end = e.toISOString();
         }
      }

      // Fetch Leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end);

      // Fetch Projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end);

      // Fetch Accepted Quotes (Revenue)
      const { data: quotesData } = await supabase
        .from('quotations')
        .select('*')
        .eq('status', 'Accepted')
        .gte('created_at', start)
        .lte('created_at', end);

      setLeads(leadsData || []);
      setProjects(projectsData || []);
      setQuotes(quotesData || []);
      setLoading(false);
  };

  // Trigger fetch when filters change
  useEffect(() => {
    // Only fetch if not custom, OR if custom and both dates are set
    if (dateFilter !== 'custom' || (customStart && customEnd)) {
        fetchData();
    }
  }, [dateFilter, customStart, customEnd]);

  // 2. CALCULATE METRICS
  const calculateTotalRevenue = () => {
    return quotes.reduce((sum, q) => {
        const cleanString = (q.amount || "").toString().replace(/[^0-9.]/g, '');
        return sum + (parseFloat(cleanString) || 0);
    }, 0);
  };
  
  const totalRevenue = calculateTotalRevenue();
  const revenueDisplay = totalRevenue > 100000 
    ? `₹${(totalRevenue / 100000).toFixed(2)} Lakh` 
    : `₹${totalRevenue.toLocaleString("en-IN")}`;

  const totalCapacityKW = projects.reduce((sum, p) => sum + (p.capacity || 0), 0);
  const capacityDisplay = totalCapacityKW > 1000 
    ? `${(totalCapacityKW / 1000).toFixed(2)} MW` 
    : `${totalCapacityKW} kW`;

  const activeLeads = leads.filter(l => l.status === 'New');
  const conversionRate = leads.length > 0 
    ? ((projects.length / leads.length) * 100).toFixed(1) 
    : "0.0";

  const statusCounts: Record<string, number> = {};
  projects.forEach(p => {
    const stage = p.stage || "Unknown";
    statusCounts[stage] = (statusCounts[stage] || 0) + 1;
  });
  const topStages = Object.entries(statusCounts).sort(([, a], [, b]) => b - a).slice(0, 5);

  const openDrillDown = (type: string) => {
      setDialogType(type);
      setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Reports</h1>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-white p-2 rounded-lg border shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500 ml-2" />
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                      {/* Fixed Class Here */}
                      <SelectTrigger className="w-40 border-none shadow-none focus:ring-0">
                          <SelectValue placeholder="Select Period" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="30_days">Last 30 Days</SelectItem>
                          <SelectItem value="this_year">This Year</SelectItem>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                  </Select>
              </div>

              {/* CUSTOM DATE INPUTS (Only visible when 'custom' selected) */}
              {dateFilter === 'custom' && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                      <Input 
                        type="date" 
                        className="h-8 w-fit text-xs" 
                        value={customStart} 
                        onChange={(e) => setCustomStart(e.target.value)} 
                      />
                      <span className="text-slate-400 text-xs">to</span>
                      <Input 
                        type="date" 
                        className="h-8 w-fit text-xs" 
                        value={customEnd} 
                        onChange={(e) => setCustomEnd(e.target.value)} 
                      />
                      <Button size="sm" className="h-8 px-2 bg-slate-900 text-white" onClick={fetchData}>
                          Apply
                      </Button>
                  </div>
              )}
          </div>
      </div>
      
      {loading ? (
          <div className="flex h-64 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
      ) : (
          <>
            {/* 1. Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                
                <Card 
                    className="border-l-4 border-green-500 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openDrillDown('revenue')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Confirmed Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{revenueDisplay}</div>
                        <p className="text-xs text-slate-500">{quotes.length} Accepted Quotes</p>
                    </CardContent>
                </Card>
                
                <Card 
                    className="border-l-4 border-blue-500 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openDrillDown('leads')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{leads.length}</div>
                        <p className="text-xs text-slate-500">{activeLeads.length} currently 'New'</p>
                    </CardContent>
                </Card>

                <Card 
                    className="border-l-4 border-orange-500 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openDrillDown('capacity')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
                        <Zap className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{capacityDisplay}</div>
                        <p className="text-xs text-slate-500">Across {projects.length} Projects</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{conversionRate}%</div>
                        <p className="text-xs text-slate-500">Leads turned to Projects</p>
                    </CardContent>
                </Card>
            </div>

            {/* 2. Analysis Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-50 flex items-end gap-4 p-4 border-b border-l border-slate-200">
                            {['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'].map((m, i) => (
                                <div key={m} className="flex-1 flex flex-col justify-end items-center gap-2 group">
                                    <div 
                                        className="w-full bg-slate-900 group-hover:bg-[#65A30D] transition-colors rounded-t-sm" 
                                        style={{height: `${30 + (i * 10) + Math.random() * 20}%`}} 
                                    ></div>
                                    <span className="text-xs text-slate-500">{m}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-4 text-center">
                            * Mock Visualization for V1
                        </p>
                    </CardContent>
                </Card>
                
                <Card className="col-span-3">
                    <CardHeader><CardTitle>Project Stages</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topStages.length === 0 ? (
                                <div className="text-center text-slate-500 py-8">No active projects data.</div>
                            ) : (
                                topStages.map(([stage, count]) => (
                                    <div key={stage} className="flex items-center">
                                        <div className="ml-4 space-y-1 w-full">
                                            <div className="flex justify-between">
                                                <p className="text-sm font-medium leading-none">{stage}</p>
                                                <div className="font-bold">{count}</div>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                                                <div className="h-full bg-blue-500" style={{ width: `${(count / projects.length) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
          </>
      )}

      {/* DRILL DOWN DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
         <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
             <DialogHeader>
                 <DialogTitle>
                     {dialogType === 'revenue' ? "Confirmed Revenue Details" : 
                      dialogType === 'leads' ? "Lead Details" : "Project Capacity Details"}
                 </DialogTitle>
             </DialogHeader>

             <Table>
                 <TableHeader>
                     <TableRow>
                         <TableHead>Date</TableHead>
                         <TableHead>Client / Name</TableHead>
                         <TableHead className="text-right">
                             {dialogType === 'revenue' ? "Amount" : 
                              dialogType === 'leads' ? "Status" : "Capacity"}
                         </TableHead>
                     </TableRow>
                 </TableHeader>
                 <TableBody>
                     {dialogType === 'revenue' && quotes.map(q => (
                         <TableRow key={q.id}>
                             <TableCell>{new Date(q.created_at).toLocaleDateString()}</TableCell>
                             <TableCell>{q.client_name}</TableCell>
                             <TableCell className="text-right text-green-600 font-bold">{q.amount}</TableCell>
                         </TableRow>
                     ))}

                     {dialogType === 'leads' && leads.map(l => (
                         <TableRow key={l.id}>
                             <TableCell>{new Date(l.created_at).toLocaleDateString()}</TableCell>
                             <TableCell>
                                 {l.name}
                                 <div className="text-xs text-slate-500">{l.city}</div>
                             </TableCell>
                             <TableCell className="text-right">
                                 <span className={`px-2 py-1 rounded text-xs ${l.status === 'New' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'}`}>
                                     {l.status}
                                 </span>
                             </TableCell>
                         </TableRow>
                     ))}

                     {dialogType === 'capacity' && projects.map(p => (
                         <TableRow key={p.id}>
                             <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                             <TableCell>{p.client_name}</TableCell>
                             <TableCell className="text-right font-bold">{p.capacity} kW</TableCell>
                         </TableRow>
                     ))}
                 </TableBody>
             </Table>
             <DialogFooter>
                 <Button onClick={() => setDialogOpen(false)}>Close</Button>
             </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}