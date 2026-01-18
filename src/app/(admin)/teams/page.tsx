// src/app/(admin)/teams/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client"; // Import Supabase
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, MapPin, Phone, Users, Truck, CalendarClock, Loader2 } from "lucide-react";
import Link from "next/link";

export default function FieldTeamsPage() {
  const supabase = createClient();
  const [filter, setFilter] = useState("");
  const [teams, setTeams] = useState<any[]>([]); // Real Data
  const [loading, setLoading] = useState(true);

  // 1. FETCH TEAMS FROM DB
  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error("Error fetching teams:", error);
      } else {
        setTeams(data || []);
      }
      setLoading(false);
    };

    fetchTeams();
  }, []);

  // 2. CALCULATE STATS
  const deployedCount = teams.filter(t => t.status === "Deployed").length;
  const availableCount = teams.filter(t => t.status === "Available").length;
  const onLeaveCount = teams.filter(t => t.status === "On Leave").length;

  // 3. FILTER LOGIC
  const filteredTeams = teams.filter(t => 
    (t.name?.toLowerCase() || "").includes(filter.toLowerCase()) ||
    (t.leader?.toLowerCase() || "").includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Field Teams</h1>
           <p className="text-slate-500">Manage installation crews and assignments.</p>
        </div>
        <div className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search teams..." 
                  className="pl-9 w-64" 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            <Button className="bg-[#65A30D] hover:bg-[#558b0b]">
                <Plus className="w-4 h-4 mr-2" /> Add Crew
            </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Truck className="w-6 h-6"/></div>
                  <div>
                      <p className="text-xs font-bold uppercase text-blue-800">Deployed</p>
                      <p className="text-2xl font-bold text-blue-900">{deployedCount} Teams</p>
                  </div>
              </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-100">
              <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full text-green-600"><Users className="w-6 h-6"/></div>
                  <div>
                      <p className="text-xs font-bold uppercase text-green-800">Available</p>
                      <p className="text-2xl font-bold text-green-900">{availableCount} Team{availableCount !== 1 ? 's' : ''}</p>
                  </div>
              </CardContent>
          </Card>
          <Card className="bg-slate-50 border-slate-200">
              <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-slate-200 rounded-full text-slate-600"><CalendarClock className="w-6 h-6"/></div>
                  <div>
                      <p className="text-xs font-bold uppercase text-slate-600">On Leave</p>
                      <p className="text-2xl font-bold text-slate-700">{onLeaveCount} Team{onLeaveCount !== 1 ? 's' : ''}</p>
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading Field Teams...
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
             No teams found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredTeams.map((team) => (
               <Card key={team.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <Badge className={
                          team.status === "Available" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                          team.status === "Deployed" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                          "bg-slate-100 text-slate-600 hover:bg-slate-100"
                      }>
                          {team.status}
                      </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      
                      {/* Leader Info */}
                      <div className="flex items-center gap-3 pb-3 border-b">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                              {(team.leader || "U").charAt(0)}
                          </div>
                          <div>
                              <p className="text-sm font-medium">{team.leader}</p>
                              <p className="text-xs text-slate-500">{team.members} Technicians</p>
                          </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2 text-slate-600">
                              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                              <span>{team.location || "No Location"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                              <Phone className="w-4 h-4" />
                              <span>{team.contact}</span>
                          </div>
                           <div className="flex items-center gap-2 text-slate-600">
                              <Users className="w-4 h-4" />
                              <span>Spec: {team.specialty}</span>
                          </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 flex gap-2">
                          {team.status === "Available" ? (
                               <Button className="w-full bg-[#65A30D] hover:bg-[#558b0b]">Assign Project</Button>
                          ) : (
                               <Link href="/schedule/residential" className="w-full">
                                  <Button variant="outline" className="w-full">View Schedule</Button>
                               </Link>
                          )}
                      </div>

                  </CardContent>
               </Card>
           ))}
        </div>
      )}

    </div>
  );
}