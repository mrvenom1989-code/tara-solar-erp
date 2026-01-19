// src/app/(admin)/dashboard/page.tsx
import Link from "next/link";
import { createClient } from "@/utils/supabase/server"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, Zap, Package, AlertTriangle, 
  FileText, Plus, HardHat, Calendar, Clock, MapPin 
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const todayStr = new Date().toISOString().split('T')[0];

  // 2. FETCH REAL DATA (Parallel fetching)
  const [
    { count: leadsCount },
    { count: projectsCount },
    { data: lowStockItems },
    { data: teams },
    { data: todayJobs }, // NEW: Fetch today's schedule
    { data: recentLeads },
    { data: recentProjects }
  ] = await Promise.all([
    // Count New Leads
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'New'),
    
    // Count Active Projects
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'In Progress'),
    
    // Get Low Stock Items
    supabase.from('inventory').select('stock, min_level'),

    // Get Deployed Teams
    supabase.from('teams').select('*').eq('status', 'Deployed'),

    // NEW: Get Today's Jobs
    supabase.from('jobs')
      .select('*')
      .eq('date', todayStr)
      .order('time_slot', { ascending: true }),

    // Recent Activity (Leads)
    supabase.from('leads').select('name, created_at').order('created_at', { ascending: false }).limit(3),
    
    // Recent Activity (Projects)
    supabase.from('projects').select('client_name, created_at').order('created_at', { ascending: false }).limit(3)
  ]);

  // Calculations
  const lowStockCount = (lowStockItems || []).filter((i: any) => i.stock < i.min_level).length;
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

      {/* 2. KEY METRICS */}
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
        
        {/* Left Column: TODAY'S SCHEDULE (High Priority) */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="border-b bg-slate-50/50">
            <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-500"/> Today's Schedule
                </CardTitle>
                <span className="text-xs font-bold px-2 py-1 bg-slate-200 rounded text-slate-600">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                </span>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {(!todayJobs || todayJobs.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <Calendar className="w-12 h-12 mb-4 opacity-20"/>
                    <p>No jobs scheduled for today.</p>
                    <Link href="/schedule/residential" className="mt-4 text-blue-600 hover:underline text-sm">
                        View Weekly Calendar
                    </Link>
                </div>
            ) : (
                <div className="divide-y">
                    {todayJobs.map((job: any) => (
                        <div key={job.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 p-2 rounded-lg ${
                                    job.type === 'Industrial' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                }`}>
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{job.client_name}</p>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <MapPin className="w-3 h-3"/> {job.city}
                                        <span className="text-slate-300">|</span>
                                        <span className="font-medium text-slate-700">{job.team}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-slate-900">{job.time_slot}</div>
                                <div className={`text-xs px-2 py-0.5 rounded inline-block mt-1 ${
                                    job.status === 'Install' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {job.status}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </CardContent>
        </Card>
        
        {/* Right Column: Shortcuts & Feed */}
        <div className="space-y-6">
            
            {/* Shortcuts */}
            <Card>
                 <CardHeader className="pb-3">
                    <CardTitle className="text-sm uppercase text-slate-500">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                    <Link href="/schedule/residential">
                        <div className="p-3 text-center border rounded-lg hover:bg-green-50 hover:border-green-200 cursor-pointer transition-colors group">
                            <p className="text-xs font-bold text-slate-600 group-hover:text-green-700">Residential Schedule</p>
                        </div>
                    </Link>
                    <Link href="/schedule/industrial">
                         <div className="p-3 text-center border rounded-lg hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors group">
                            <p className="text-xs font-bold text-slate-600 group-hover:text-blue-700">Industrial Schedule</p>
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
                </CardContent>
            </Card>

            {/* Recent Activity Feed */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm uppercase text-slate-500">Recent Updates</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentProjects?.map((proj: any, i: number) => (
                            <div key={`p-${i}`} className="flex gap-3 text-sm">
                                <div className="mt-0.5 w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                                <div>
                                    <p className="leading-none text-slate-700">Project Started: <strong>{proj.client_name}</strong></p>
                                    <p className="text-xs text-slate-400 mt-1">{new Date(proj.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                        {recentLeads?.map((lead: any, i: number) => (
                            <div key={`l-${i}`} className="flex gap-3 text-sm">
                                <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                <div>
                                    <p className="leading-none text-slate-700">New Lead: <strong>{lead.name}</strong></p>
                                    <p className="text-xs text-slate-400 mt-1">{new Date(lead.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                         {(!recentProjects?.length && !recentLeads?.length) && (
                            <p className="text-xs text-slate-400 italic">No recent activity.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

        </div>
      </div>
    </div>
  );
}