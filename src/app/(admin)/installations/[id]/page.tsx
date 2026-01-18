// src/app/(admin)/installations/[id]/page.tsx
"use client";

import { useState, useEffect, use } from "react"; // Added 'use' for unwrapping params in Next.js 15+ if needed, but standard params works here usually.
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, CheckCircle2, Calendar, HardHat, FileCheck, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Static list of standard installation stages
const INSTALLATION_STAGES = [
    "Site Survey & Design",
    "Material Procurement",
    "Structure Erection",
    "Module Mounting",
    "Electrical Wiring (AC/DC)",
    "Net Metering Liaison",
    "Commissioning"
];

export default function InstallationDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const router = useRouter();
  
  // Unwrap params (Fix for Next.js 15 async params if strictly enforced, otherwise standard access works)
  // In Next.js 15, params can sometimes be a Promise. To be safe, we access id directly if it's available.
  const id = params.id; 

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // FETCH PROJECT DETAILS
  useEffect(() => {
    const fetchProjectDetails = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Error fetching project:", error);
      } else {
        setProject(data);
      }
      setLoading(false);
    };

    if (id) fetchProjectDetails();
  }, [id]);

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#65A30D]" />
          </div>
      );
  }

  if (!project) {
      return (
          <div className="p-8 text-center">
              <h2 className="text-xl font-bold">Project Not Found</h2>
              <Link href="/installations"><Button className="mt-4">Go Back</Button></Link>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      
      {/* Back Button */}
      <Link href="/installations" className="flex items-center text-sm text-slate-500 hover:text-[#65A30D] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to List
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 border-b pb-6">
         <div>
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{project.client_name}</h1>
                <Badge className={
                    project.status === "Completed" ? "bg-green-100 text-green-700 hover:bg-green-100 border-none" :
                    "bg-blue-100 text-blue-700 hover:bg-blue-100 border-none"
                }>
                    {project.status}
                </Badge>
            </div>
            <p className="text-slate-500 flex items-center gap-2">
                <span className="font-semibold text-slate-700">{project.capacity} kW {project.type}</span> 
                • {project.location}
            </p>
         </div>
         <div className="flex gap-2">
             <Button variant="outline">Edit Details</Button>
             <Button className="bg-[#65A30D] hover:bg-[#558b0b]">Update Stage</Button>
         </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-6">
            <TabsTrigger value="overview">Overview & Timeline</TabsTrigger>
            <TabsTrigger value="documents">Documents & Photos</TabsTrigger>
            <TabsTrigger value="team">Team & Tasks</TabsTrigger>
        </TabsList>

        {/* 1. OVERVIEW TAB */}
        <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Stages Checklist (Dynamic) */}
                <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Installation Stages</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        {INSTALLATION_STAGES.map((stepName, i) => {
                            // Logic to determine status of this step based on DB 'stage'
                            // Note: In a real app, you'd want a more robust way to order these.
                            // Here we assume simple linear progression for the UI.
                            const currentStageIndex = INSTALLATION_STAGES.indexOf(project.stage || "Site Survey & Design");
                            
                            let status = "pending";
                            if (i < currentStageIndex) status = "completed";
                            if (i === currentStageIndex) status = "current";

                            return (
                                <div key={i} className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                                        status === "completed" ? "bg-green-100 border-green-500 text-green-600" :
                                        status === "current" ? "bg-blue-100 border-blue-500 text-blue-600 animate-pulse" :
                                        "bg-slate-50 border-slate-200 text-slate-300"
                                    }`}>
                                        {status === "completed" ? <CheckCircle2 className="w-5 h-5"/> : <span className="text-xs font-bold">{i+1}</span>}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`font-medium ${status === "pending" ? "text-slate-400" : "text-slate-900"}`}>{stepName}</h4>
                                        <p className="text-xs text-slate-500">
                                            {status === "current" ? "In Progress" : status === "completed" ? "Completed" : "-"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Info Cards */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-sm uppercase text-slate-500">Key Dates</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-[#65A30D]" />
                                <div>
                                    <p className="text-sm font-bold">Start Date</p>
                                    <p className="text-xs text-slate-500">
                                        {project.created_at ? new Date(project.created_at).toLocaleDateString() : "N/A"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FileCheck className="w-5 h-5 text-[#F59E0B]" />
                                <div>
                                    <p className="text-sm font-bold">Expected Handover</p>
                                    <p className="text-xs text-slate-500">--</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader><CardTitle className="text-sm uppercase text-slate-500">Lead Technician</CardTitle></CardHeader>
                         <CardContent className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                                 <HardHat className="w-6 h-6 text-slate-500" />
                             </div>
                             <div>
                                 <p className="font-bold">Not Assigned</p>
                                 <p className="text-xs text-slate-500">--</p>
                             </div>
                         </CardContent>
                    </Card>
                </div>

            </div>
        </TabsContent>

        {/* 2. DOCUMENTS TAB */}
        <TabsContent value="documents">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Installation Documents</CardTitle>
                    <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-2"/> Upload New</Button>
                </CardHeader>
                <CardContent>
                    {/* Placeholder for Documents - You would need a separate 'documents' table in Supabase for this */}
                    <div className="text-center py-10 text-slate-500 bg-slate-50 border border-dashed rounded-xl">
                        No documents uploaded for this project yet.
                    </div>
                </CardContent>
             </Card>
        </TabsContent>

        {/* 3. TEAM TAB */}
        <TabsContent value="team">
            <Card>
                <CardContent className="p-8 text-center text-slate-500">
                    <p>Team Assignment Module (Coming Soon)</p>
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}