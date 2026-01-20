// src/app/(admin)/documents/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Factory, Home, Download, Plus, Clock, Search, Loader2, Calendar, Filter } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client"; 

export default function DocumentsPage() {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Date Filter State
  const [dateFilter, setDateFilter] = useState("all"); 
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // 1. FETCH QUOTATIONS
  const fetchQuotes = async () => {
    setLoading(true);
    
    let query = supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });

    const now = new Date();
    
    if (dateFilter === '30_days') {
        const d = new Date(); 
        d.setDate(d.getDate() - 30);
        query = query.gte('created_at', d.toISOString());
    } else if (dateFilter === 'this_year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
        query = query.gte('created_at', startOfYear);
    } else if (dateFilter === 'custom') {
        if (customStart) query = query.gte('created_at', new Date(customStart).toISOString());
        if (customEnd) {
            const e = new Date(customEnd);
            e.setHours(23, 59, 59, 999);
            query = query.lte('created_at', e.toISOString());
        }
    }

    const { data, error } = await query;
    
    if (data) setQuotes(data);
    if (error) console.error("Error fetching quotes:", error);
    setLoading(false);
  };

  // Trigger fetch when filters change
  useEffect(() => {
    if (dateFilter !== 'custom' || (customStart && customEnd)) {
        fetchQuotes();
    }
  }, [dateFilter, customStart, customEnd]);

  return (
    <div className="space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Quotations & Documents</h1>
            <p className="text-slate-500">Generate proposals and manage documentation history.</p>
        </div>
      </div>
      
      {/* 1. CREATE NEW ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Residential Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Home className="w-24 h-24 text-green-700" />
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4 relative z-10">
                <Home className="h-6 w-6 text-green-700" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white relative z-10">Residential Quotation</h3>
            <p className="text-slate-500 mb-6 text-sm relative z-10">
              Generate a standard rooftop solar proposal for homeowners. 
              Includes subsidy calculations (PM Surya Ghar).
            </p>
            <Link href="/documents/residential-quote" className="relative z-10 block">
                <Button className="w-full bg-[#65A30D] hover:bg-[#4d7c0f] text-white">
                    <Plus className="w-4 h-4 mr-2" /> Create Residential Quote
                </Button>
            </Link>
        </div>

        {/* Industrial Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Factory className="w-24 h-24 text-blue-700" />
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 relative z-10">
                <Factory className="h-6 w-6 text-blue-700" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white relative z-10">Industrial / Commercial Quote</h3>
            <p className="text-slate-500 mb-6 text-sm relative z-10">
              Generate a detailed EPC proposal with Scope Matrix, 
              Milestone Payments, and Technical Specs.
            </p>
            <Link href="/documents/industrial-quote" className="relative z-10 block">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Create Industrial Quote
                </Button>
            </Link>
        </div>

      </div>

      {/* 2. DOCUMENTS LIST WITH FILTER */}
      <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <CardTitle>Quotations History</CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  {/* SEARCH */}
                  <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Search client name..." 
                        className="pl-9" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>

                  {/* DATE FILTER GROUP */}
                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-md border border-slate-200">
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                          <SelectTrigger className="w-32 h-9 border-none shadow-none bg-transparent focus:ring-0">
                              <div className="flex items-center gap-2 text-slate-600">
                                  <Calendar className="w-4 h-4"/>
                                  <SelectValue placeholder="Period" />
                              </div>
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All Time</SelectItem>
                              <SelectItem value="30_days">Last 30 Days</SelectItem>
                              <SelectItem value="this_year">This Year</SelectItem>
                              <SelectItem value="custom">Custom Range</SelectItem>
                          </SelectContent>
                      </Select>

                      {/* CUSTOM INPUTS */}
                      {dateFilter === 'custom' && (
                          <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                              <div className="w-px h-4 bg-slate-300 mx-1"></div>
                              <Input 
                                type="date" 
                                className="h-7 w-fit text-xs px-2" 
                                value={customStart} 
                                onChange={(e) => setCustomStart(e.target.value)} 
                              />
                              <span className="text-xs text-slate-400">-</span>
                              <Input 
                                type="date" 
                                className="h-7 w-fit text-xs px-2" 
                                value={customEnd} 
                                onChange={(e) => setCustomEnd(e.target.value)} 
                              />
                              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={fetchQuotes}>
                                  <Filter className="w-3 h-3"/>
                              </Button>
                          </div>
                      )}
                  </div>
              </div>
          </CardHeader>
          
          <CardContent className="p-0">
              {loading ? (
                  <div className="p-12 text-center text-slate-500 flex justify-center items-center gap-2">
                      <Loader2 className="animate-spin h-5 w-5"/> Loading History...
                  </div>
              ) : quotes.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 border-t">
                      No quotations found for this period.
                  </div>
              ) : (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Client Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {quotes.filter(q => q.client_name?.toLowerCase().includes(searchTerm.toLowerCase())).map((quote: any) => (
                              <TableRow key={quote.id} className="hover:bg-slate-50">
                                  <TableCell className="text-slate-500 flex items-center gap-2">
                                      <Clock className="w-3 h-3" />
                                      {new Date(quote.created_at).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell className="font-medium">{quote.client_name}</TableCell>
                                  <TableCell>
                                      <Badge variant="outline" className={
                                          quote.type === 'Industrial' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-green-200 bg-green-50 text-green-700'
                                      }>
                                          {quote.type}
                                      </Badge>
                                  </TableCell>
                                  <TableCell>{quote.amount}</TableCell>
                                  <TableCell>
                                      <Badge className={
                                          quote.status === 'Sent' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                                          quote.status === 'Accepted' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                          'bg-slate-100 text-slate-700 hover:bg-slate-100'
                                      }>
                                          {quote.status}
                                      </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                      {/* LINK TO THE GENERATOR PAGE USING ID TO LOAD SNAPSHOT */}
                                      <Link href={quote.type === 'Industrial' 
                                          ? `/documents/industrial-quote?id=${quote.id}` 
                                          : `/documents/residential-quote?id=${quote.id}`
                                      }>
                                          <Button size="sm" variant="outline" className="text-slate-600 border-slate-300">
                                              <Download className="w-4 h-4 mr-2" /> View / PDF
                                          </Button>
                                      </Link>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              )}
          </CardContent>
      </Card>
    </div>
  );
}