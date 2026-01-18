// src/app/(admin)/documents/industrial-quote/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Check, X, Save, Loader2, ArrowLeft } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function IndustrialQuoteGenerator() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentDate, setCurrentDate] = useState("");
  const [saving, setSaving] = useState(false);

  // 1. Initialize State
  const [client, setClient] = useState("Chemtech Intermediated Pvt Ltd");
  const [capacity, setCapacity] = useState("1000"); // KW
  const [rate, setRate] = useState("31500"); // Per KW

  // 2. Hydration & URL Param Logic
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString("en-IN"));
    
    // Check URL parameters from Leads Page
    const clientParam = searchParams.get("client");
    const capacityParam = searchParams.get("capacity");

    if (clientParam) setClient(clientParam);
    if (capacityParam) setCapacity(capacityParam);
    
  }, [searchParams]);

  // 3. Calculations
  const totalVal = parseFloat(capacity) * parseFloat(rate);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });
  };

  // 4. SAVE FUNCTION
  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('quotations').insert({
        client_name: client,
        type: 'Industrial',
        amount: `₹${formatCurrency(totalVal)}`,
        status: 'Generated'
    });

    if (error) {
        alert("Error saving: " + error.message);
        setSaving(false);
    } else {
        alert("Industrial Quote Saved!");
        router.push("/documents");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* 🖨️ PRINT STYLE */}
      <style type="text/css" media="print">
      {`
        @page { size: A4; margin: 0mm; }
        body { visibility: hidden; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        #print-area { visibility: visible; position: absolute; top: 0; left: 0; width: 210mm; min-height: 297mm; background: white; color: black; margin: 0; padding: 15mm; }
        ::-webkit-scrollbar { display: none; }
        .break-before { page-break-before: always; }
        .break-inside-avoid { page-break-inside: avoid; }
      `}
      </style>

      {/* 1. CONTROLS (Hidden when printing) */}
      <div className="print:hidden space-y-4">
        <Link href="/documents" className="text-slate-500 hover:text-slate-900 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Documents
        </Link>
        
        <Card>
            <CardContent className="flex flex-col md:flex-row gap-4 p-6 items-end">
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold">Client Name</label>
                    <Input value={client} onChange={e => setClient(e.target.value)} />
                </div>
                <div className="w-full md:w-32">
                    <label className="text-xs font-bold">Capacity (KW)</label>
                    <Input value={capacity} onChange={e => setCapacity(e.target.value)} />
                </div>
                <div className="w-full md:w-32">
                    <label className="text-xs font-bold">Rate/Watt (₹)</label>
                    <Input value={rate} onChange={e => setRate(e.target.value)} />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" /> Print
                    </Button>
                    <Button className="bg-blue-900 hover:bg-blue-800" onClick={handleSave} disabled={saving}>
                         {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                         Save
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* 2. PRINTABLE DOCUMENT */}
      <div className="bg-white p-12 border shadow-xl print:shadow-none print:border-none text-slate-800 font-sans" id="print-area">
        
        {/* --- COVER PAGE --- */}
        <div className="min-h-225 flex flex-col justify-between">
             <div className="flex items-center gap-4 border-b-4 border-blue-900 pb-6">
                <div className="relative w-16 h-16">
                     <Image src="/logo.png" alt="Logo" width={64} height={64} className="object-contain" />
                </div>
                <div>
                     <h1 className="text-3xl font-bold text-blue-900 uppercase">Techno-Commercial Proposal</h1>
                     <p className="text-lg text-slate-600">Grid Connected Ground Mount Solar Power Plant</p>
                </div>
             </div>

             <div className="my-12 text-center">
                 <div className="inline-block bg-blue-50 px-8 py-4 rounded-xl border border-blue-200">
                     <p className="text-sm text-slate-500 uppercase tracking-widest mb-2">Project Capacity</p>
                     <span className="font-bold text-5xl text-blue-900">{capacity} KWp</span>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-12 mb-20">
                 <div className="p-6 bg-slate-50 rounded-lg border-l-4 border-blue-900">
                     <p className="text-xs text-slate-500 uppercase font-bold mb-2">Prepared For</p>
                     <h2 className="text-2xl font-bold text-slate-900">{client}</h2>
                     <p>Gujarat, India</p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-lg border-l-4 border-[#65A30D]">
                     <p className="text-xs text-slate-500 uppercase font-bold mb-2">Submitted By</p>
                     <h2 className="text-2xl font-bold text-[#65A30D]">Tara Solar Energy</h2>
                     <p>EPC Division, Satlasana</p>
                     <p className="text-sm mt-2">+91 94289 56700</p>
                     <p className="text-sm mt-2">Date: {currentDate}</p>
                 </div>
             </div>
             
             <div className="text-center text-xs text-slate-400">
                 <p>Tara Solar Energy | Private & Confidential</p>
             </div>
        </div>

        {/* --- PAGE 2: TECHNICAL DETAILS --- */}
        <div className="break-before pt-8">
            <h3 className="text-lg font-bold bg-slate-100 p-2 mb-6 border-l-4 border-blue-900">1. Project Technical Summary</h3>
            
            <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm mb-8">
                 <div className="flex justify-between border-b border-dashed py-2"><span>Plant Capacity (DC)</span><span className="font-bold">{capacity} KWp</span></div>
                 <div className="flex justify-between border-b border-dashed py-2"><span>Evacuation Voltage</span><span className="font-bold">11 KV</span></div>
                 <div className="flex justify-between border-b border-dashed py-2"><span>Module Type</span><span className="font-bold">N-Type Bi-Facial</span></div>
                 <div className="flex justify-between border-b border-dashed py-2"><span>Generation (Year 1)</span><span className="font-bold">~16.5 Lakh Units</span></div>
            </div>

            <h3 className="text-lg font-bold bg-slate-100 p-2 mb-6 border-l-4 border-blue-900">2. Technical Makes & Specs</h3>
            <table className="w-full text-sm border border-slate-300 mb-8">
                <thead className="bg-blue-900 text-white">
                    <tr>
                        <th className="p-2 text-left w-1/4">Component</th>
                        <th className="p-2 text-left">Specification</th>
                        <th className="p-2 text-left w-1/3">Preferred Make</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b"><td className="p-2 font-bold">Solar Modules</td><td className="p-2">590Wp+ TopCon Bi-Facial Glass-Glass</td><td className="p-2">Waaree / Adani / Goldi</td></tr>
                    <tr className="border-b"><td className="p-2 font-bold">Inverters</td><td className="p-2">String Inverters (Grid Tie)</td><td className="p-2">Sungrow / Solis / Goodwe</td></tr>
                    <tr className="border-b"><td className="p-2 font-bold">Structure</td><td className="p-2">Hot Dip Galvanized (80 micron)</td><td className="p-2">Tara Solar Fab / Reputed</td></tr>
                    <tr className="border-b"><td className="p-2 font-bold">AC/DC Cables</td><td className="p-2">Copper/Alu Armored</td><td className="p-2">Polycab / RR / Apar</td></tr>
                    <tr className="border-b"><td className="p-2 font-bold">HT Panel</td><td className="p-2">11kV VCB Panel</td><td className="p-2">Siemens / L&T / C&S</td></tr>
                    <tr className="border-b"><td className="p-2 font-bold">Transformer</td><td className="p-2">Inverter Duty Step-up</td><td className="p-2">Voltamp / T&R / Reputed</td></tr>
                </tbody>
            </table>

            <h3 className="text-lg font-bold bg-slate-100 p-2 mb-6 border-l-4 border-blue-900">3. Scope Matrix</h3>
            <table className="w-full text-sm border border-slate-300">
                <thead className="bg-slate-200">
                    <tr>
                        <th className="p-2 text-left">Activity</th>
                        <th className="p-2 text-center w-24">Tara Solar</th>
                        <th className="p-2 text-center w-24">Client</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    <tr><td className="p-2">Design & Engineering</td><td className="p-2 text-center text-green-600"><Check className="inline w-4 h-4"/></td><td className="p-2 text-center text-slate-300"><X className="inline w-4 h-4"/></td></tr>
                    <tr><td className="p-2">Supply of Major Materials</td><td className="p-2 text-center text-green-600"><Check className="inline w-4 h-4"/></td><td className="p-2 text-center text-slate-300"><X className="inline w-4 h-4"/></td></tr>
                    <tr><td className="p-2">Land Acquisition & Fencing</td><td className="p-2 text-center text-slate-300"><X className="inline w-4 h-4"/></td><td className="p-2 text-center text-blue-600"><Check className="inline w-4 h-4"/></td></tr>
                    <tr><td className="p-2">Civil Foundations (Piling)</td><td className="p-2 text-center text-green-600"><Check className="inline w-4 h-4"/></td><td className="p-2 text-center text-slate-300"><X className="inline w-4 h-4"/></td></tr>
                    <tr><td className="p-2">Liaisoning (GETCO/DISCOM)</td><td className="p-2 text-center text-green-600"><Check className="inline w-4 h-4"/></td><td className="p-2 text-center text-slate-300"><X className="inline w-4 h-4"/></td></tr>
                    <tr><td className="p-2">Water & Construction Power</td><td className="p-2 text-center text-slate-300"><X className="inline w-4 h-4"/></td><td className="p-2 text-center text-blue-600"><Check className="inline w-4 h-4"/></td></tr>
                </tbody>
            </table>
        </div>

        {/* --- PAGE 3: COMMERCIALS --- */}
        <div className="break-before pt-8">
            <h3 className="text-lg font-bold bg-slate-100 p-2 mb-6 border-l-4 border-blue-900">4. Commercial Offer</h3>
            
            <div className="border border-slate-300 mb-8">
                <table className="w-full text-sm">
                    <thead>
                         <tr className="bg-slate-50 border-b">
                             <th className="p-4 text-left">Description</th>
                             <th className="p-4 text-right">Amount (INR)</th>
                         </tr>
                    </thead>
                    <tbody>
                         <tr className="border-b">
                             <td className="p-4">
                                 <strong>Turnkey EPC for {capacity} KWp Solar Power Plant</strong>
                                 <p className="text-xs text-slate-500 mt-1">Includes Design, Supply, Civil Work, Installation, Testing & Commissioning</p>
                             </td>
                             <td className="p-4 text-right text-lg font-bold">
                                 ₹ {formatCurrency(totalVal)}
                             </td>
                         </tr>
                    </tbody>
                </table>
                <div className="p-4 bg-yellow-50 text-xs text-yellow-800 border-t border-yellow-100">
                    * <strong>GST Extra as applicable:</strong> 70% of value is Supply (@12%), 30% of value is Service (@18%).
                </div>
            </div>

            <h3 className="text-lg font-bold bg-slate-100 p-2 mb-6 border-l-4 border-blue-900">5. Payment Terms</h3>
            <div className="space-y-6 text-sm">
                
                <div>
                    <h4 className="font-bold text-blue-900 border-b mb-2">A. Supply Portion (70% of Contract Value)</h4>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>10% Advance</strong> along with Work Order.</li>
                        <li><strong>60% Payment</strong> against Proforma Invoice (Before Dispatch).</li>
                        <li><strong>30% Payment</strong> upon receipt of material at site (Prorata basis).</li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-blue-900 border-b mb-2">B. Service & Erection Portion (30% of Contract Value)</h4>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>20% Advance</strong> for Mobilization.</li>
                        <li><strong>30% Payment</strong> on completion of Civil/Piling work.</li>
                        <li><strong>30% Payment</strong> on completion of Structure & Module mounting.</li>
                        <li><strong>10% Payment</strong> on Electrical Connectivity (Cabling/Inverter).</li>
                        <li><strong>10% Payment</strong> on successful Commissioning / Handover.</li>
                    </ul>
                </div>

            </div>

            <div className="mt-20 border-t pt-8 flex justify-between items-end">
                <div className="text-center">
                    <p className="border-t border-black w-48 pt-2">Accepted By (Client)</p>
                </div>
                <div className="text-center">
                    <p className="font-bold text-xl font-script text-[#65A30D]">Keyur Raval</p>
                    <p className="border-t border-black w-48 pt-2">Tara Solar Energy</p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}