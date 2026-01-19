// src/app/(public)/projects/page.tsx
import Image from "next/image";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

// ==========================================
// 🔧 DATA: 3 Images per Category
// ==========================================
const PROJECTS = [
  // RESIDENTIAL
  { id: 1, category: "residential", title: "Mehsana, Gujarat", capacity: "5.5 kW", image: "/images/res-1.jpg" },
  { id: 2, category: "residential", title: "Jaska, Gujarat", capacity: "3.3 kW", image: "/images/res-2.jpg" },
  { id: 3, category: "residential", title: "Satlasana, Gujarat", capacity: "4.4 kW", image: "/images/res-3.jpg" },
  
  // COMMERCIAL / INDUSTRIAL
  { id: 4, category: "commercial", title: "HYS Life Care, Viramgam", capacity: "600 kW", image: "/images/ind-1.jpg" },
  { id: 5, category: "commercial", title: "HARA Poly pack, Kadi", capacity: "990 kW", image: "/images/ind-2.jpg" },
  { id: 6, category: "commercial", title: "Sanand", capacity: "450 kW", image: "/images/ind-3.jpg" },
  
  // GROUND / FARMS
  { id: 7, category: "ground", title: "REL, Maharastra", capacity: "11 MW", image: "/images/ground-1.jpg" },
  { id: 8, category: "ground", title: "Banaskantha, Gujarat", capacity: "10 MW", image: "/images/ground-2.jpg" },
  { id: 9, category: "ground", title: "Modasa, Gujarat", capacity: "1.8 MW", image: "/images/ground-3.jpg" },
];

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col">
      <Navbar />

      {/* HEADER: Clean Green Theme */}
      <section className="bg-[#65A30D]/10 py-16 text-center border-b border-green-100 dark:border-green-900">
        <div className="container px-4 mx-auto">
          <Badge className="bg-[#65A30D] text-white hover:bg-[#558b0b] mb-4">Our Portfolio</Badge>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-5xl">
            Powering India's Growth
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Explore our Residential, Industrial, and Utility-scale solar installations across Gujarat.
          </p>
        </div>
      </section>

      {/* PROJECTS GRID */}
      <section className="py-16 container px-4 mx-auto flex-1">
        <Tabs defaultValue="residential" className="w-full">
          
          <div className="flex justify-center mb-12">
            <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-full">
              <TabsTrigger value="residential" className="rounded-full px-6 data-[state=active]:bg-[#65A30D] data-[state=active]:text-white">Residential</TabsTrigger>
              <TabsTrigger value="commercial" className="rounded-full px-6 data-[state=active]:bg-[#65A30D] data-[state=active]:text-white">Commercial & Ind.</TabsTrigger>
              <TabsTrigger value="ground" className="rounded-full px-6 data-[state=active]:bg-[#65A30D] data-[state=active]:text-white">Solar Farms</TabsTrigger>
            </TabsList>
          </div>

          {["residential", "commercial", "ground"].map((cat) => (
            <TabsContent key={cat} value={cat}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PROJECTS.filter(p => p.category === cat).map((project) => (
                  <Card key={project.id} className="group overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
                    <div className="relative h-64 w-full bg-slate-200 overflow-hidden">
                      <Image 
                        src={project.image} 
                        alt={project.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4">
                          <Badge className="bg-white/95 text-[#65A30D] font-bold backdrop-blur-sm shadow-sm">
                              {project.capacity}
                          </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6 text-center relative bg-white dark:bg-slate-900">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#65A30D] transition-colors">
                        {project.title}
                      </h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}

        </Tabs>
      </section>

      <Footer />
    </div>
  );
}