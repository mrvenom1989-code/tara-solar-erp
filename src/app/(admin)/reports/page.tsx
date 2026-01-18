// src/app/(admin)/reports/page.tsx
import { createClient } from "@/utils/supabase/server"; // Server Client
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, TrendingUp, Users, Zap, Loader2 } from "lucide-react";

export default async function ReportsPage() {
  const supabase = await createClient();

  // 1. FETCH ALL NECESSARY DATA (Parallel for speed)
  const [
    { count: totalLeads },
    { data: activeLeads },
    { data: projects },
    { data: acceptedQuotes }
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }), // Count all leads
    supabase.from('leads').select('*', { count: 'exact' }).eq('status', 'New'), // Active/New Leads
    supabase.from('projects').select('capacity, stage, status, created_at'),
    supabase.from('quotations').select('amount, created_at').eq('status', 'Accepted')
  ]);

  // 2. CALCULATE METRICS
  
  // A. Total Revenue (Sum of 'Accepted' Quotes)
  // Parsing "₹1,80,000" -> 180000
  const totalRevenue = (acceptedQuotes || []).reduce((sum, quote) => {
    const numericAmount = parseFloat(quote.amount?.replace(/[^0-9.]/g, '') || "0");
    return sum + numericAmount;
  }, 0);
  
  // Format Revenue (e.g. 4500000 -> 45.0 L)
  const revenueDisplay = totalRevenue > 100000 
    ? `₹${(totalRevenue / 100000).toFixed(1)} Lakh` 
    : `₹${totalRevenue.toLocaleString()}`;

  // B. Power Installed (Sum of Project Capacity)
  const totalCapacityKW = (projects || []).reduce((sum, p) => sum + (p.capacity || 0), 0);
  const capacityDisplay = totalCapacityKW > 1000 
    ? `${(totalCapacityKW / 1000).toFixed(2)} MW` 
    : `${totalCapacityKW} kW`;

  // C. Conversion Rate (Projects / Leads)
  const leadCount = totalLeads || 1; // Avoid divide by zero
  const projectCount = (projects || []).length;
  const conversionRate = ((projectCount / leadCount) * 100).toFixed(1);

  // D. Project Status Breakdown
  const statusCounts: Record<string, number> = {};
  (projects || []).forEach(p => {
    const stage = p.stage || "Unknown";
    statusCounts[stage] = (statusCounts[stage] || 0) + 1;
  });

  // Sort stages by count (descending) and take top 5
  const topStages = Object.entries(statusCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Reports</h1>
      
      {/* 1. Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Revenue Card */}
        <Card className="border-l-4 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueDisplay}</div>
            <p className="text-xs text-slate-500">From accepted quotations</p>
          </CardContent>
        </Card>
        
        {/* Active Leads Card */}
        <Card className="border-l-4 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLeads?.length || 0}</div>
            <p className="text-xs text-slate-500">Waiting for response</p>
          </CardContent>
        </Card>

        {/* Capacity Card */}
        <Card className="border-l-4 border-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacityDisplay}</div>
            <p className="text-xs text-slate-500">Across {projectCount} Projects</p>
          </CardContent>
        </Card>

        {/* Conversion Card */}
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
        
        {/* REVENUE CHART (Simulated for V1) */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             <div className="h-50 flex items-end gap-4 p-4 border-b border-l border-slate-200">
                {/* Note: For a real chart, we would group 'acceptedQuotes' by month. 
                   For this V1, we simulate the visual using CSS bars to keep it lightweight without charting libraries.
                */}
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
                * Charts based on historical quotation data (Mock visualization for V1)
             </p>
          </CardContent>
        </Card>
        
        {/* PROJECT STAGE BREAKDOWN */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Project Stages Breakdown</CardTitle>
          </CardHeader>
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
                                    <div 
                                        className="h-full bg-blue-500" 
                                        style={{ width: `${(count / projectCount) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}