// src/app/(admin)/documents/residential-quote/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Save, Loader2, ArrowLeft, Settings2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

function QuoteContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentDate, setCurrentDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. STATE: Full Control over the Quote
  const [data, setData] = useState({
    clientName: "",
    phone: "",
    address: "",
    capacity: "3",       // kW
    rate: "45000",       // Price per kW (Editable)
    subsidy: "78000",    // Govt Subsidy
    panelMake: "Waaree", // Brand Control
    inverterMake: "Solis"// Brand Control
  });

  // 2. HYDRATION: Load from Saved Snapshot OR New Lead
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString("en-IN"));
    
    const loadData = async () => {
        const quoteId = searchParams.get("id"); // Viewing saved quote?
        const clientParam = searchParams.get("client"); // New quote from lead?
        
        if (quoteId) {
            // A. VIEW MODE: Fetch exact snapshot
            const { data: quote, error } = await supabase
                .from('quotations')
                .select('*')
                .eq('id', quoteId)
                .single();
            
            if (quote && quote.data_snapshot) {
                // Restore the frozen state
                setData(quote.data_snapshot);
            } else if (error) {
                console.error("Error loading quote:", error);
            }
        } else if (clientParam) {
            // B. CREATE MODE: Pre-fill from URL params
            const capacityParam = searchParams.get("capacity") || "3";
            const addressParam = searchParams.get("address") || "";
            const phoneParam = searchParams.get("phone") || "";

            setData(prev => ({
                ...prev,
                clientName: clientParam,
                capacity: capacityParam,
                address: addressParam,
                phone: phoneParam
            }));
        }
        setLoading(false);
    };

    loadData();
  }, [searchParams]);

  // 3. CALCULATIONS (Dynamic based on user input)
  const totalCost = parseFloat(data.capacity) * parseFloat(data.rate);
  const netCost = totalCost - parseFloat(data.subsidy);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
  };

  // 4. SAVE (SNAPSHOT)
  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase.from('quotations').insert({
        client_name: data.clientName,
        type: 'Residential',
        amount: `₹${formatCurrency(netCost)}`,
        status: 'Generated',
        capacity: data.capacity, // Store separately for indexing
        address: data.address,
        phone: data.phone,
        data_snapshot: data // THE KEY FIX: Save full JSON state
    });

    if (error) {
        alert("Error saving: " + error.message);
        setSaving(false);
    } else {
        alert("Quote Saved Successfully!");
        router.push("/documents");
    }
  };

  if (loading) return <div className="flex justify-center h-screen items-center"><Loader2 className="animate-spin" /></div>;

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
      <div className="print:hidden">
         <Link href="/documents" className="text-slate-500 hover:text-slate-900 flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Documents
        </Link>

        <Card className="border-slate-200 shadow-md">
            <CardHeader className="bg-slate-100 border-b flex flex-row items-center gap-2">
                <Settings2 className="w-5 h-5 text-slate-500"/>
                <CardTitle>Quote Configuration</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
                
                {/* Client Details */}
                <div className="md:col-span-2 space-y-4 border-r pr-6">
                    <h4 className="font-bold text-sm text-slate-500 uppercase">Customer Info</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold">Client Name</label>
                            <Input value={data.clientName} onChange={(e) => setData({...data, clientName: e.target.value})} />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold">Address</label>
                            <Input value={data.address} onChange={(e) => setData({...data, address: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold">Phone</label>
                            <Input value={data.phone} onChange={(e) => setData({...data, phone: e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* Technical & Commercial */}
                <div className="md:col-span-2 space-y-4 pl-2">
                    <h4 className="font-bold text-sm text-slate-500 uppercase">System & Pricing</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold">Capacity (kW)</label>
                            <Input type="number" value={data.capacity} onChange={(e) => setData({...data, capacity: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[#65A30D]">Rate per kW (₹)</label>
                            <Input type="number" value={data.rate} onChange={(e) => setData({...data, rate: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold">Panel Brand</label>
                            <Select value={data.panelMake} onValueChange={(val) => setData({...data, panelMake: val})}>
                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Waaree">Waaree</SelectItem>
                                    <SelectItem value="Adani">Adani</SelectItem>
                                    <SelectItem value="Goldi">Goldi</SelectItem>
                                    <SelectItem value="Axitec">Axitec</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs font-bold">Inverter Brand</label>
                            <Select value={data.inverterMake} onValueChange={(val) => setData({...data, inverterMake: val})}>
                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Solis">Solis</SelectItem>
                                    <SelectItem value="Growatt">Growatt</SelectItem>
                                    <SelectItem value="Havells">Havells</SelectItem>
                                    <SelectItem value="GoodWe">GoodWe</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-green-600">Subsidy Adjustment (₹)</label>
                            <Input type="number" value={data.subsidy} onChange={(e) => setData({...data, subsidy: e.target.value})} />
                        </div>
                    </div>
                </div>
                
                {/* Footer Actions */}
                <div className="md:col-span-4 pt-4 flex gap-3 justify-end border-t mt-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" /> Print / PDF
                    </Button>
                    {!searchParams.get('id') && (
                        <Button className="bg-[#65A30D] hover:bg-[#558b0b]" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
                            Save Quote
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>

      {/* 2. PRINTABLE DOCUMENT */}
      <div className="bg-white p-12 border shadow-xl print:shadow-none print:border-none text-slate-900 font-sans leading-relaxed min-h-[297mm]" id="print-area">
        
        {/* --- PAGE 1: COVER LETTER --- */}
        <div className="relative">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-[#65A30D] pb-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16">
                         <Image src="/logo.png" alt="Logo" width={64} height={64} className="object-contain" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            <span className="text-[#65A30D]">TARA</span> <span className="text-[#F59E0B]">SOLAR</span>
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">EPC Division | Satlasana, Gujarat</p>
                    </div>
                </div>
                <div className="text-right text-sm">
                    <p><strong>Date:</strong> {currentDate}</p>
                    <p><strong>Quote ID:</strong> TS/{new Date().getFullYear()}/{Math.floor(Math.random() * 10000)}</p>
                </div>
            </div>

            {/* To Address */}
            <div className="mb-10 pl-2">
                <p className="text-sm text-slate-500 mb-1">Prepared For:</p>
                <h2 className="text-2xl font-bold text-slate-900">{data.clientName}</h2>
                <p className="text-base text-slate-700 max-w-sm mt-1">{data.address || "Gujarat, India"}</p>
                {data.phone && <p className="text-sm text-slate-500 mt-1">Mo: {data.phone}</p>}
            </div>

            {/* Subject Line */}
            <div className="mb-8 bg-slate-50 p-4 rounded-lg border-l-4 border-[#65A30D]">
                <p className="text-base">
                    <strong>Subject:</strong> Proposal for {data.capacity} kWp Grid-Connected Residential Rooftop Solar Power Plant.
                </p>
            </div>

            {/* Letter Body */}
            <div className="space-y-6 text-sm text-justify mb-16 leading-7">
                <p>Dear Sir/Madam,</p>
                <p>
                    We thank you for your interest in adopting green energy. <strong>Tara Solar Energy</strong> is pleased to submit 
                    this technical and commercial proposal for the design, supply, installation, and commissioning of a Solar PV System 
                    at your residence.
                </p>
                <p>
                    Our solution is designed to maximize generation using premium <strong>{data.panelMake}</strong> modules and 
                    high-efficiency <strong>{data.inverterMake}</strong> inverters, ensuring a high return on investment and long-term reliability.
                </p>
                <p>
                    Please find below the detailed technical specifications, scope of work, and commercial offer for your review.
                </p>
                <p>Assuring you of our best services always.</p>
            </div>

            {/* Sign Off */}
            <div className="mt-12">
                <p className="font-bold text-[#65A30D]">For, Tara Solar Energy</p>
                <div className="h-20"></div> 
                <p className="font-bold border-t border-slate-300 w-48 pt-2">Authorized Signatory</p>
            </div>
        </div>

        {/* --- PAGE 2: TECHNO-COMMERCIAL --- */}
        <div className="break-before pt-8">
            <h3 className="text-xl font-bold text-center mb-8 uppercase border-b-2 border-slate-100 pb-4">Techno-Commercial Offer</h3>
            
            {/* 1. BILL OF MATERIAL */}
            <div className="mb-10">
                <h4 className="font-bold text-[#65A30D] mb-3 text-lg">1. Bill of Materials (BoM)</h4>
                <table className="w-full text-sm border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700">
                        <tr>
                            <th className="p-3 text-center border w-16">SN</th>
                            <th className="p-3 text-left border">Component Description</th>
                            <th className="p-3 text-left border">Make / Specification</th>
                            <th className="p-3 text-center border w-24">Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="p-3 text-center border">1</td>
                            <td className="p-3 border font-medium">Solar PV Modules (Mono-PERC / TopCon)</td>
                            <td className="p-3 border text-slate-600">{data.panelMake} (540Wp+)</td>
                            <td className="p-3 text-center border">{Math.ceil(parseFloat(data.capacity)/0.540)} Nos</td>
                        </tr>
                        <tr>
                            <td className="p-3 text-center border">2</td>
                            <td className="p-3 border font-medium">Solar Inverter (Grid Tie)</td>
                            <td className="p-3 border text-slate-600">{data.inverterMake}</td>
                            <td className="p-3 text-center border">1 Set</td>
                        </tr>
                        <tr>
                            <td className="p-3 text-center border">3</td>
                            <td className="p-3 border">Module Mounting Structure</td>
                            <td className="p-3 border text-slate-600">Hot Dip Galvanized (HDG)</td>
                            <td className="p-3 text-center border">Set</td>
                        </tr>
                        <tr>
                            <td className="p-3 text-center border">4</td>
                            <td className="p-3 border">AC Distribution Box (ACDB)</td>
                            <td className="p-3 border text-slate-600">With MCB & SPD</td>
                            <td className="p-3 text-center border">1 No</td>
                        </tr>
                        <tr>
                            <td className="p-3 text-center border">5</td>
                            <td className="p-3 border">DC Distribution Box (DCDB)</td>
                            <td className="p-3 border text-slate-600">With Fuse & SPD</td>
                            <td className="p-3 text-center border">1 No</td>
                        </tr>
                        <tr>
                            <td className="p-3 text-center border">6</td>
                            <td className="p-3 border">DC Cable (Solar Grade)</td>
                            <td className="p-3 border text-slate-600">Polycab / RR (4 sq mm)</td>
                            <td className="p-3 text-center border">As Req.</td>
                        </tr>
                        <tr>
                            <td className="p-3 text-center border">7</td>
                            <td className="p-3 border">AC Cable</td>
                            <td className="p-3 border text-slate-600">Polycab / RR (Copper)</td>
                            <td className="p-3 text-center border">As Req.</td>
                        </tr>
                        <tr>
                            <td className="p-3 text-center border">8</td>
                            <td className="p-3 border">Earthing Kit</td>
                            <td className="p-3 border text-slate-600">Chemical Earthing (1.5m)</td>
                            <td className="p-3 text-center border">3 Sets</td>
                        </tr>
                        <tr>
                            <td className="p-3 text-center border">9</td>
                            <td className="p-3 border">Lightning Arrestor (LA)</td>
                            <td className="p-3 border text-slate-600">Copper Bonded</td>
                            <td className="p-3 text-center border">1 No</td>
                        </tr>
                        <tr>
                            <td className="p-3 text-center border">10</td>
                            <td className="p-3 border">Net Metering Liaisoning</td>
                            <td className="p-3 border text-slate-600">DISCOM Application</td>
                            <td className="p-3 text-center border">Included</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 2. COMMERCIALS */}
            <div className="mb-10 break-inside-avoid">
                <h4 className="font-bold text-[#65A30D] mb-3 text-lg">2. Commercial Proposal</h4>
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <div className="flex justify-between p-4 border-b bg-slate-50">
                        <div>
                            <span className="font-medium text-slate-900">System Cost ({data.capacity} kWp)</span>
                            <p className="text-xs text-slate-500">@{data.rate}/Watt - Includes Supply, Installation & Commissioning</p>
                        </div>
                        <span className="font-bold text-lg">₹{formatCurrency(totalCost)}</span>
                    </div>
                    
                    <div className="flex justify-between p-4 border-b text-green-700 bg-green-50/50">
                        <span className="font-medium">Less: PM Surya Ghar Subsidy (Est.)</span>
                        <span className="font-bold">- ₹{formatCurrency(parseFloat(data.subsidy))}</span>
                    </div>
                    
                    <div className="flex justify-between p-5 bg-slate-900 text-white text-xl">
                        <span className="font-bold">Net Payable by Customer</span>
                        <span className="font-bold">₹{formatCurrency(netCost)}</span>
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-right">* GST Included. Subsidy amount is credited directly to customer via DBT.</p>
            </div>

            {/* 3. BANK & TERMS */}
            <div className="grid grid-cols-2 gap-8 break-inside-avoid">
                <div className="bg-slate-50 p-5 rounded-lg border">
                    <h4 className="font-bold text-slate-800 mb-3 border-b pb-1">Bank Details</h4>
                    <div className="space-y-1 text-sm text-slate-600">
                        <p><span className="font-semibold text-slate-900">Name:</span> TARA SOLAR ENERGY</p>
                        <p><span className="font-semibold text-slate-900">Bank:</span> HDFC Bank</p>
                        <p><span className="font-semibold text-slate-900">A/c No:</span> 50200106286546</p>
                        <p><span className="font-semibold text-slate-900">IFSC:</span> HDFC0004055</p>
                        <p><span className="font-semibold text-slate-900">Branch:</span> Satlasana</p>
                    </div>
                </div>

                <div className="text-sm text-slate-600">
                    <h4 className="font-bold text-slate-800 mb-2">Terms & Conditions</h4>
                    <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Warranty:</strong> 25 Years (Performance) on Panels, 10 Years on Inverter.</li>
                        <li><strong>Payment:</strong> 100% Advance before material dispatch.</li>
                        <li><strong>Net Meter:</strong> Charges to be paid by customer to DISCOM at actuals.</li>
                        <li><strong>Validity:</strong> This offer is valid for 7 days.</li>
                    </ul>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}

// 3. Export Wrapper
export default function ResidentialQuoteGenerator() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-8 h-8 text-[#65A30D]" /></div>}>
      <QuoteContent />
    </Suspense>
  )
}