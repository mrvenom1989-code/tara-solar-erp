// src/app/(admin)/dashboard/page.tsx
import Link from "next/link";
import { createClient } from "@/utils/supabase/server"; // ✅ Importing the SERVER client
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, Zap, Package, AlertTriangle, 
  FileText, Plus, HardHat, ArrowRight 
} from "lucide-react";

// This is now a Server Component (async)
export default async function DashboardPage() {
  // 1. ✅ AWAIT THE SERVER CLIENT
  const supabase = await createClient();

  // 2. FETCH REAL DATA (Parallel fetching for speed)
  const [
    { count: leadsCount },
    { count: projectsCount },
    { data: lowStockItems },
    { data: teams },
    { data: recentLeads },
    { data: recentProjects }
  ] = await Promise.all([
    // Count New Leads
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'New'),
    
    // Count Active Projects
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'In Progress'),
    
    // Get Low Stock Items (We fetch data to count JS-side or use complex filter)
    supabase.from('inventory').select('stock, min_level'),

    // Get Deployed Teams
    supabase.from('teams').select('*').eq('status', 'Deployed'),

    // Recent Activity (Leads)
    supabase.from('leads').select('name, created_at').order('created_at', { ascending: false }).limit(2),
    
    // Recent Activity (Projects)
    supabase.from('projects').select('client_name, created_at').order('created_at', { ascending: false }).limit(2)
  ]);

  // Calculate Low Stock Count
  const lowStockCount = (lowStockItems || []).filter((i: any) => i.stock < i.min_level).length;
  
  // Calculate Deployed Teams
  const deployedTeamsCount = (teams || []).length;

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Operations Dashboard</h1>
           <p className="text-slate-500">Overview of today's site activities and pending tasks.</p>
        </div>
        <div className="flex gap-2">
            <Link href="/leads">
                <Button className="bg-slate-900 text-white hover:bg-slate-800">
                    <Plus className="w-4 h-4 mr-2" /> New Lead
                </Button>
            </Link>
            <Link href="/documents">
                <Button className="bg-[#65A30D] text-white hover:bg-[#558b0b]">
                    <FileText className="w-4 h-4 mr-2" /> Create Quote
                </Button>
            </Link>
        </div>
      </div>

      {/* 2. KEY METRICS (REAL DB DATA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: New Leads */}
        <Link href="/leads">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{leadsCount || 0}</div>
                <p className="text-xs text-slate-500">Inquiries waiting for response</p>
            </CardContent>
            </Card>
        </Link>
        
        {/* Card 2: Active Installations */}
        <Link href="/installations">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
                <HardHat className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{projectsCount || 0}</div>
                <p className="text-xs text-slate-500">Projects currently in progress</p>
            </CardContent>
            </Card>
        </Link>

        {/* Card 3: Inventory Alerts */}
        <Link href="/inventory">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-red-500 bg-red-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-700">Stock Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-red-700">{lowStockCount} Items</div>
                <p className="text-xs text-red-600 font-semibold">Below minimum level</p>
            </CardContent>
            </Card>
        </Link>

        {/* Card 4: Team Status */}
        <Link href="/teams">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Field Teams</CardTitle>
                <Zap className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{deployedTeamsCount} Active</div>
                <p className="text-xs text-slate-500">Teams currently on site</p>
            </CardContent>
            </Card>
        </Link>

      </div>

      {/* 3. MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Activity Feed (REAL DATA) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
                
                {/* Loop through Recent Projects */}
                {recentProjects?.map((proj: any, i: number) => (
                    <div key={`p-${i}`} className="flex items-start gap-4">
                        <div className="mt-1 bg-orange-100 p-2 rounded-full">
                            <HardHat className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Project Started: <span className="font-bold">{proj.client_name}</span></p>
                            <p className="text-xs text-slate-500">New installation project created</p>
                            <p className="text-xs text-slate-400 mt-1">{new Date(proj.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}

                {/* Loop through Recent Leads */}
                {recentLeads?.map((lead: any, i: number) => (
                    <div key={`l-${i}`} className="flex items-start gap-4">
                         <div className="mt-1 bg-blue-100 p-2 rounded-full">
                            <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">New Lead: <span className="font-bold">{lead.name}</span></p>
                            <p className="text-xs text-slate-500">Inquiry received via CRM</p>
                            <p className="text-xs text-slate-400 mt-1">{new Date(lead.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
                
                {(!recentProjects?.length && !recentLeads?.length) && (
                    <p className="text-sm text-slate-500 text-center py-4">No recent activity found.</p>
                )}

            </div>
          </CardContent>
        </Card>
        
        {/* Right Column: Shortcuts */}
        <div className="space-y-6">
            <Card>
                 <CardHeader>
                    <CardTitle className="text-sm uppercase text-slate-500">Quick Shortcuts</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                    <Link href="/schedule/residential">
                        <div className="p-3 text-center border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                            <p className="text-xs font-bold text-slate-600">Weekly Schedule</p>
                        </div>
                    </Link>
                    <Link href="/reports">
                         <div className="p-3 text-center border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                            <p className="text-xs font-bold text-slate-600">View Reports</p>
                        </div>
                    </Link>
                    <Link href="/inventory">
                         <div className="p-3 text-center border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                            <p className="text-xs font-bold text-slate-600">Check Stock</p>
                        </div>
                    </Link>
                     <Link href="/teams">
                         <div className="p-3 text-center border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                            <p className="text-xs font-bold text-slate-600">Manage Teams</p>
                        </div>
                    </Link>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}