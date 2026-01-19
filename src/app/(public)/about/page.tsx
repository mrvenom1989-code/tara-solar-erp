// src/app/(public)/about/page.tsx
import Image from "next/image";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Users, Lightbulb, Leaf, MapPin } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col">
      <Navbar />

      {/* HEADER */}
      <section className="bg-[#65A30D]/10 py-20 text-center border-b border-green-100 dark:border-green-900">
        <div className="container px-4 mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl">About Tara Solar</h1>
          <p className="mt-4 text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Driven by innovation, expertise, and a passion for environmental stewardship.
          </p>
        </div>
      </section>

      {/* 1. MISSION SECTION */}
      <section className="py-20 container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[#65A30D] font-bold tracking-wide text-sm uppercase mb-4">
              <Leaf className="w-5 h-5" /> Our Mission
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              Empowering Communities with Sustainable Energy
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Our mission is to empower communities and businesses with sustainable energy solutions by providing top-quality solar installations. We are committed to reducing carbon footprints, lowering energy costs, and driving the transition to renewable energy sources.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Through innovation, expertise, and a passion for environmental stewardship, we aim to create a cleaner, more sustainable future for generations to come.
            </p>
          </div>
          <div className="relative h-100 rounded-2xl overflow-hidden shadow-2xl">
             <Image 
               src="/images/mission.jpg" 
               alt="Sustainable Future" 
               fill 
               className="object-cover"
             />
          </div>
        </div>
      </section>

      {/* 2. WHERE INNOVATION HAPPENS (OFFICE & TEAM) */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-[#65A30D] mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Where Innovation Happens</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              Located in Satlasana, Gujarat, our headquarters is the hub of our operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* OFFICE PHOTO */}
              <div className="relative h-100 rounded-2xl overflow-hidden shadow-xl border border-slate-100 dark:border-slate-800 group">
                <Image 
                   src="/images/office.jpg" 
                   alt="Tara Solar Office" 
                   fill 
                   className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-8">
                    <h3 className="text-2xl font-bold text-white">Our Headquarters</h3>
                    <p className="text-white/80">Satlasana, Gujarat</p>
                </div>
              </div>

              {/* TEAM PHOTO */}
              <div className="relative h-100 rounded-2xl overflow-hidden shadow-xl border border-slate-100 dark:border-slate-800 group">
                <Image 
                   src="/images/team.jpg" 
                   alt="Tara Solar Team" 
                   fill 
                   className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-8">
                    <h3 className="text-2xl font-bold text-white">The Team</h3>
                    <p className="text-white/80">United by a commitment to sustainability.</p>
                </div>
              </div>
          </div>
          
          <div className="mt-12 text-center max-w-4xl mx-auto">
             <p className="text-slate-600 dark:text-slate-300 text-lg italic">
              "Solar rooftop installation team @Tara Solar is united by a shared commitment to providing sustainable energy solutions, working collaboratively to ensure the highest standards of safety, efficiency, and quality in every project we complete."
             </p>
          </div>
        </div>
      </section>

      {/* 3. FOUNDER PROFILE */}
      <section className="py-20 container px-4 mx-auto">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            
            {/* Founder Image */}
            <div className="w-full md:w-1/3">
              <div className="relative aspect-3/4 rounded-2xl overflow-hidden shadow-lg border-4 border-white dark:border-slate-700">
                <Image 
                  src="/images/founder.jpg" 
                  alt="Keyur Raval - Founder" 
                  fill 
                  className="object-cover"
                />
              </div>
            </div>

            {/* Founder Text */}
            <div className="w-full md:w-2/3">
              <div className="inline-flex items-center gap-2 text-[#F59E0B] font-bold tracking-wide text-sm uppercase mb-4">
                <Lightbulb className="w-5 h-5" /> Leadership
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Keyur Raval</h2>
              <p className="text-[#65A30D] font-medium mb-6">Founder & CEO</p>
              
              <div className="space-y-4 text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                <p>
                  The founder of our solar rooftop installation company is a forward-thinking leader with a strong background in engineering and a deep commitment to sustainability.
                </p>
                <p>
                  With years of experience in the renewable energy sector, Keyur saw an opportunity to make a lasting impact by providing accessible, high-quality solar energy solutions. Driven by a passion for reducing carbon footprints, he built Tara Solar with a vision of creating a greener future for homes and businesses.
                </p>
                <p>
                  His leadership style is rooted in innovation, problem-solving, and fostering a culture of collaboration and excellence within the team.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}