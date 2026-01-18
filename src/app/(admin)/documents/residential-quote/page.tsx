// src/app/(admin)/documents/residential-quote/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Save, Loader2, ArrowLeft } from "lucide-react"; // Added Icons
import { useSearchParams, useRouter } from "next/navigation"; // Added useRouter
import { createClient } from "@/utils/supabase/client"; // Added Supabase Client
import Link from "next/link";

export default function ResidentialQuoteGenerator() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentDate, setCurrentDate] = useState("");
  const [saving, setSaving] = useState(false); // Loading state for save button

  // 1. Initialize State
  const [data, setData] = useState({
    clientName: "Dipak Bhai Joshi",
    phone: "9876543210",
    address: "B-404, Ganesh Glory, Jagatpur, Ahmedabad",
    capacity: "3.24",
    pricePerKw: "52469", 
    subsidy: "78000",
  });

  // 2. Hydration & URL Param Logic
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString("en-IN"));
    
    const clientParam = searchParams.get("client");
    const capacityParam = searchParams.get("capacity");

    if (clientParam || capacityParam) {
        setData(prev => ({
            ...prev,
            clientName: clientParam || prev.clientName,
            capacity: capacityParam || prev.capacity
        }));
    }
  }, [searchParams]);

  // 3. Calculations
  const totalCost = parseFloat(data.capacity) * parseFloat(data.pricePerKw);
  const netCost = totalCost - parseFloat(data.subsidy);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });
  };

  // 4. SAVE TO DATABASE FUNCTION
  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase.from('quotations').insert({
        client_name: data.clientName,
        type: 'Residential',
        amount: `₹${formatCurrency(netCost)}`,
        status: 'Generated'
    });

    if (error) {
        alert("Error saving quotation: " + error.message);
        setSaving(false);
    } else {
        alert("Quotation saved successfully!");
        router.push("/documents"); // Redirect to list
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
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

      {/* 1. INPUT FORM (Hidden when printing) */}
      <div className="print:hidden">
         <Link href="/documents" className="text-slate-500 hover:text-slate-900 flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Documents
        </Link>

        <Card className="border-slate-200 shadow-md">
            <CardHeader className="bg-slate-100 border-b">
            <CardTitle>Quote Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 p-6">
                <div>
                    <label className="text-sm font-medium">Customer Name</label>
                    <Input value={data.clientName} onChange={(e) => setData({...data, clientName: e.target.value})} />
                </div>
                <div>
                    <label className="text-sm font-medium">Address</label>
                    <Input value={data.address} onChange={(e) => setData({...data, address: e.target.value})} />
                </div>
                <div>
                    <label className="text-sm font-medium">System Size (kW)</label>
                    <Input type="number" value={data.capacity} onChange={(e) => setData({...data, capacity: e.target.value})} />
                </div>
                <div>
                    <label className="text-sm font-medium">Subsidy (₹)</label>
                    <Input type="number" value={data.subsidy} onChange={(e) => setData({...data, subsidy: e.target.value})} />
                </div>
                
                {/* ACTION BUTTONS */}
                <div className="col-span-2 pt-4 flex gap-3">
                    <Button variant="outline" className="w-1/2" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" /> Print / PDF
                    </Button>
                    <Button className="w-1/2 bg-[#65A30D] hover:bg-[#558b0b]" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
                        Save Record
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* 2. PRINTABLE DOCUMENT */}
      <div className="bg-white p-8 border shadow-lg print:shadow-none print:border-none text-slate-900 font-sans leading-relaxed" id="print-area">
        
        {/* --- PAGE 1: COVER LETTER --- */}
        <div className="min-h-250 relative">
            
            {/* Header with Logo */}
            <div className="flex justify-between items-start border-b-2 border-[#65A30D] pb-4 mb-8">
                <div className="flex items-center gap-2">
                    {/* LOGO */}
                    <div className="relative w-12 h-12">
                         <Image src="/logo.png" alt="Logo" width={48} height={48} className="object-contain" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            <span className="text-[#65A30D]">TARA</span> <span className="text-[#F59E0B]">SOLAR</span>
                        </h1>
                        <p className="text-xs text-slate-500">Satlasana, Gujarat | +91 94289 56700</p>
                    </div>
                </div>
                <div className="text-right text-sm">
                    <p><strong>Date:</strong> {currentDate}</p>
                    <p><strong>Proposal No:</strong> TS/26/{Math.floor(Math.random() * 1000)}</p>
                </div>
            </div>

            {/* To Address */}
            <div className="mb-8">
                <p className="text-sm text-slate-500">To,</p>
                <h2 className="text-xl font-bold">{data.clientName}</h2>
                <p className="text-sm max-w-xs">{data.address}</p>
                <p className="text-sm">Mo: {data.phone}</p>
            </div>

            {/* Subject */}
            <div className="mb-6 bg-slate-50 p-3 rounded-md border-l-4 border-[#65A30D]">
                <p><strong>Subject:</strong> Quotation for {data.capacity} kWp Residential Rooftop Solar PV Project</p>
            </div>

            {/* Letter Body */}
            <div className="space-y-4 text-sm text-justify mb-12">
                <p>Dear Sir/Madam,</p>
                <p>
                    We would like to thank you for your valuable enquiry. <strong>Tara Solar Energy</strong> is pleased to submit 
                    this proposal for the design, supply, installation, and maintenance of a Grid-Connected Solar PV System 
                    at your premises.
                </p>
                <p>
                    We appreciate the opportunity to present this offer. Our team is committed to providing technically 
                    competent and timely execution of the project. We use only Tier-1 Solar Modules and top-rated Inverters 
                    to ensure maximum generation for your home.
                </p>
                <p>
                    With reference to our recent communication, we are submitting our detailed budget offer below for 
                    your review.
                </p>
                <p>Thank you in anticipation,</p>
            </div>

            {/* Sign Off */}
            <div className="mt-8">
                <p className="font-bold text-[#65A30D]">For, Tara Solar Energy</p>
                <div className="h-16"></div> {/* Space for sign */}
                <p className="font-bold">Authorized Signatory</p>
            </div>
        </div>

        {/* --- PAGE 2: TECHNO-COMMERCIAL --- */}
        <div className="break-before pt-8">
            <h3 className="text-xl font-bold text-center mb-6 uppercase border-b pb-2">Techno-Commercial Proposal</h3>
            
            {/* 1. BILL OF MATERIAL */}
            <div className="mb-8">
                <h4 className="font-bold text-[#65A30D] mb-2">1. Bill of Materials (Deliverables)</h4>
                <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border p-2 w-12 text-center">SN</th>
                            <th className="border p-2 text-left">Component Description</th>
                            <th className="border p-2 text-left">Make / Spec</th>
                            <th className="border p-2 text-center">Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td className="border p-2 text-center">1</td><td className="border p-2">Solar PV Modules (Mono-PERC / TopCon)</td><td className="border p-2">Waaree / Adani / Goldi (540Wp+)</td><td className="border p-2 text-center">{Math.ceil(parseFloat(data.capacity)/0.540)} Nos</td></tr>
                        <tr><td className="border p-2 text-center">2</td><td className="border p-2">Solar Inverter (Grid Tie)</td><td className="border p-2">Solis / Growatt / Havells</td><td className="border p-2 text-center">1 No</td></tr>
                        <tr><td className="border p-2 text-center">3</td><td className="border p-2">Module Mounting Structure</td><td className="border p-2">Hot Dip Galvanized (HDG)</td><td className="border p-2 text-center">Set</td></tr>
                        <tr><td className="border p-2 text-center">4</td><td className="border p-2">AC Distribution Box (ACDB)</td><td className="border p-2">With MCB & SPD</td><td className="border p-2 text-center">1 No</td></tr>
                        <tr><td className="border p-2 text-center">5</td><td className="border p-2">DC Distribution Box (DCDB)</td><td className="border p-2">With Fuse & SPD</td><td className="border p-2 text-center">1 No</td></tr>
                        <tr><td className="border p-2 text-center">6</td><td className="border p-2">DC Cable (Solar Grade)</td><td className="border p-2">Polycab / RR (4 sq mm)</td><td className="border p-2 text-center">As Req.</td></tr>
                        <tr><td className="border p-2 text-center">7</td><td className="border p-2">AC Cable</td><td className="border p-2">Polycab / RR (Copper)</td><td className="border p-2 text-center">As Req.</td></tr>
                        <tr><td className="border p-2 text-center">8</td><td className="border p-2">Earthing Kit</td><td className="border p-2">Chemical Earthing (1.5m)</td><td className="border p-2 text-center">3 Sets</td></tr>
                        <tr><td className="border p-2 text-center">9</td><td className="border p-2">Lightning Arrestor (LA)</td><td className="border p-2">Copper Bonded</td><td className="border p-2 text-center">1 No</td></tr>
                        <tr><td className="border p-2 text-center">10</td><td className="border p-2">Net Metering Liaisoning</td><td className="border p-2">DISCOM Application</td><td className="border p-2 text-center">Included</td></tr>
                    </tbody>
                </table>
            </div>

            {/* 2. COMMERCIALS */}
            <div className="mb-8 break-inside-avoid">
                <h4 className="font-bold text-[#65A30D] mb-2">2. Commercial Offer</h4>
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <div className="flex justify-between p-3 border-b bg-slate-50">
                        <span>System Cost (Design, Supply, Installation)</span>
                        <span className="font-bold">₹{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between p-3 border-b">
                        <span>GST (Inclusive)</span>
                        <span className="text-slate-500 text-sm">Included</span>
                    </div>
                    <div className="flex justify-between p-3 border-b text-green-700 bg-green-50">
                        <span>Less: Govt. Subsidy (PM Surya Ghar)</span>
                        <span className="font-bold">- ₹{formatCurrency(parseFloat(data.subsidy))}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-slate-900 text-white text-lg font-bold">
                        <span>Net Payable by Customer</span>
                        <span>₹{formatCurrency(netCost)}</span>
                    </div>
                </div>
            </div>

            {/* 3. BANK DETAILS */}
            <div className="mb-8 p-4 bg-slate-100 rounded-lg break-inside-avoid">
                <h4 className="font-bold text-slate-800 mb-2 border-b border-slate-300 pb-1">Bank Account Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Account Name:</strong> TARA SOLAR ENERGY</p>
                    <p><strong>Bank Name:</strong> HDFC Bank</p>
                    <p><strong>Account No:</strong> 50200106286546</p>
                    <p><strong>IFSC Code:</strong> HDFC0004055</p>
                    <p><strong>Branch:</strong> Satlasana</p>
                    <p><strong>Type:</strong> Current Account</p>
                </div>
            </div>

            {/* 4. TERMS */}
            <div className="text-xs text-slate-600 space-y-1 break-inside-avoid">
                <h4 className="font-bold text-black uppercase text-sm mb-1">Terms & Conditions:</h4>
                <ul className="list-disc pl-4">
                    <li><strong>Warranty:</strong> 25 Years (Performance) on Panels, 10 Years on Inverter.</li>
                    <li><strong>Payment:</strong> 100% Advance before material dispatch.</li>
                    <li><strong>Subsidy:</strong> Credited directly to customer account by Govt (DBT). We assist in the process.</li>
                    <li><strong>Net Meter:</strong> Charges to be paid by customer to DISCOM at actuals.</li>
                    <li><strong>Validity:</strong> This offer is valid for 7 days.</li>
                </ul>
            </div>

        </div>
      </div>
    </div>
  );
}