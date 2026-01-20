// src/app/(admin)/documents/residential-quote/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Save, Loader2, ArrowLeft, Settings2, RefreshCcw } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

// --- TYPES ---
type BoMRow = {
  sn: number;
  description: string;
  make: string;
  qty: string;
};

function QuoteContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentDate, setCurrentDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. MASTER STATE (High Level Config)
  const [data, setData] = useState({
    clientName: "",
    phone: "",
    address: "",
    capacity: "3",       // kW
    rate: "45000",       // Price per kW
    subsidy: "78000",    // Govt Subsidy
    panelMake: "Waaree", 
    panelSpec: "540Wp Mono-PERC", // NEW: Free text spec
    inverterMake: "Solis",
    inverterSpec: "Dual MPPT",    // NEW: Free text spec
  });

  // 2. DETAILED STATE (The BoM Grid)
  const [bomRows, setBomRows] = useState<BoMRow[]>([
    { sn: 1, description: "Solar PV Modules", make: "", qty: "" },
    { sn: 2, description: "Solar Inverter (Grid Tie)", make: "", qty: "1 Set" },
    { sn: 3, description: "Module Mounting Structure", make: "Hot Dip Galvanized (HDG)", qty: "Set" },
    { sn: 4, description: "AC Distribution Box (ACDB)", make: "With MCB & SPD", qty: "1 No" },
    { sn: 5, description: "DC Distribution Box (DCDB)", make: "With Fuse & SPD", qty: "1 No" },
    { sn: 6, description: "DC Cable (Solar Grade)", make: "Polycab / RR (4 sq mm)", qty: "As Req." },
    { sn: 7, description: "AC Cable", make: "Polycab / RR (Copper)", qty: "As Req." },
    { sn: 8, description: "Earthing Kit", make: "Chemical Earthing (1.5m)", qty: "3 Sets" },
    { sn: 9, description: "Lightning Arrestor (LA)", make: "Copper Bonded", qty: "1 No" },
    { sn: 10, description: "Net Metering Liaisoning", make: "DISCOM Application", qty: "Included" },
  ]);

  // 3. AUTO-SYNC LOGIC (Updates BoM when Master Config changes)
  useEffect(() => {
    // Only update if data is loaded
    if (loading) return;

    setBomRows(prevRows => {
      const newRows = [...prevRows];

      // Update Panel Row (SN 1)
      newRows[0].make = `${data.panelMake} (${data.panelSpec})`;
      // Auto-calculate Qty: Capacity (kW) * 1000 / Panel Wattage (Estimate 540W if not specified)
      // We parse the first number found in spec as wattage, fallback to 540
      const wattageMatch = data.panelSpec.match(/(\d+)/);
      const wattage = wattageMatch ? parseInt(wattageMatch[0]) : 540;
      const panelQty = Math.ceil((parseFloat(data.capacity || "0") * 1000) / wattage);
      newRows[0].qty = `${panelQty} Nos`;

      // Update Inverter Row (SN 2)
      newRows[1].make = `${data.inverterMake} ${data.inverterSpec}`;

      return newRows;
    });
  }, [data.panelMake, data.panelSpec, data.inverterMake, data.inverterSpec, data.capacity, loading]);


  // 4. LOAD DATA
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString("en-IN"));
    
    const loadData = async () => {
        const quoteId = searchParams.get("id");
        const clientParam = searchParams.get("client");
        
        if (quoteId) {
            const { data: quote, error } = await supabase
                .from('quotations')
                .select('*')
                .eq('id', quoteId)
                .single();
            
            if (quote && quote.data_snapshot) {
                setData(quote.data_snapshot);
                // If the snapshot has saved BoM rows, load them too (Future proofing)
                if(quote.data_snapshot.bomRows) {
                    setBomRows(quote.data_snapshot.bomRows);
                }
            } else if (error) {
                console.error("Error loading quote:", error);
            }
        } else if (clientParam) {
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

  // 5. HELPER: Handle Table Edit
  const handleBomChange = (index: number, field: keyof BoMRow, value: string) => {
      const newRows = [...bomRows];
      // @ts-ignore
      newRows[index][field] = value;
      setBomRows(newRows);
  };

  // 6. CALCULATIONS
  const totalCost = parseFloat(data.capacity) * parseFloat(data.rate);
  const netCost = totalCost - parseFloat(data.subsidy);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
  };

  // 7. SAVE
  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase.from('quotations').insert({
        client_name: data.clientName,
        type: 'Residential',
        amount: `₹${formatCurrency(netCost)}`,
        status: 'Generated',
        capacity: data.capacity,
        address: data.address,
        phone: data.phone,
        // We save BOTH the master config AND the specific table rows
        data_snapshot: { ...data, bomRows } 
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
        input { border: none !important; padding: 0 !important; background: transparent !important; }
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
                        
                        {/* PANEL SECTION */}
                        <div className="col-span-2 grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded">
                            <div>
                                <label className="text-xs font-bold">Panel Brand</label>
                                <Select value={data.panelMake} onValueChange={(val) => setData({...data, panelMake: val})}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Waaree">Waaree</SelectItem>
                                        <SelectItem value="Adani">Adani</SelectItem>
                                        <SelectItem value="Goldi">Goldi</SelectItem>
                                        <SelectItem value="Axitec">Axitec</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs font-bold">Capacity/Spec (Free Text)</label>
                                <Input className="h-9" value={data.panelSpec} onChange={(e) => setData({...data, panelSpec: e.target.value})} placeholder="e.g. 550W Bifacial" />
                            </div>
                        </div>

                        {/* INVERTER SECTION */}
                        <div className="col-span-2 grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded">
                            <div>
                                <label className="text-xs font-bold">Inverter Brand</label>
                                <Select value={data.inverterMake} onValueChange={(val) => setData({...data, inverterMake: val})}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Solis">Solis</SelectItem>
                                        <SelectItem value="Growatt">Growatt</SelectItem>
                                        <SelectItem value="Havells">Havells</SelectItem>
                                        <SelectItem value="GoodWe">GoodWe</SelectItem>
                                        <SelectItem value="Vsole">Vsole</SelectItem> {/* Added Vsole */}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs font-bold">Specification (Free Text)</label>
                                <Input className="h-9" value={data.inverterSpec} onChange={(e) => setData({...data, inverterSpec: e.target.value})} placeholder="e.g. 10kW Dual MPPT" />
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="text-xs font-bold text-green-600">Subsidy Adjustment (₹)</label>
                            <Input type="number" value={data.subsidy} onChange={(e) => setData({...data, subsidy: e.target.value})} />
                        </div>
                    </div>
                </div>
                
                {/* Footer Actions */}
                <div className="md:col-span-4 pt-4 flex gap-3 justify-end border-t mt-2">
                    <div className="text-xs text-slate-400 flex items-center mr-auto">
                        <RefreshCcw className="w-3 h-3 mr-1"/> BoM updates automatically based on settings above. You can also edit the table below directly.
                    </div>
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
                        {bomRows.map((row, index) => (
                            <tr key={row.sn}>
                                <td className="p-3 text-center border">{row.sn}</td>
                                <td className="p-1 border">
                                    {/* Editable Description */}
                                    <input 
                                        value={row.description}
                                        onChange={(e) => handleBomChange(index, "description", e.target.value)}
                                        className="w-full h-full bg-transparent p-2 focus:outline-none focus:bg-slate-50 font-medium"
                                    />
                                </td>
                                <td className="p-1 border">
                                    {/* Editable Make/Spec */}
                                    <input 
                                        value={row.make}
                                        onChange={(e) => handleBomChange(index, "make", e.target.value)}
                                        className="w-full h-full bg-transparent p-2 focus:outline-none focus:bg-slate-50 text-slate-600"
                                    />
                                </td>
                                <td className="p-1 border text-center">
                                    {/* Editable Qty */}
                                    <input 
                                        value={row.qty}
                                        onChange={(e) => handleBomChange(index, "qty", e.target.value)}
                                        className="w-full h-full bg-transparent p-2 text-center focus:outline-none focus:bg-slate-50"
                                    />
                                </td>
                            </tr>
                        ))}
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