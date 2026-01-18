// src/app/(admin)/documents/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Factory, Home, Download, Plus, Clock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server"; // Server Client

// Convert to Async Server Component
export default async function DocumentsPage() {
  const supabase = await createClient();

  // 1. FETCH QUOTATIONS (Real Data)
  const { data: quotes, error } = await supabase
    .from('quotations')
    .select('*')
    .order('created_at', { ascending: false });

  // Fallback if table doesn't exist yet
  const recentQuotes = quotes || [];

  return (
    <div className="space-y-8">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
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

      {/* 2. RECENT DOCUMENTS LIST */}
      <Card>
          <CardHeader>
              <CardTitle>Recent Quotations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
              {recentQuotes.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 border-t">
                      No quotations generated yet.
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
                              <TableHead className="text-right">Download</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {recentQuotes.map((quote: any) => (
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
                                      <Button size="sm" variant="ghost" className="text-slate-500 hover:text-slate-900">
                                          <Download className="w-4 h-4 mr-2" /> PDF
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
  );
}