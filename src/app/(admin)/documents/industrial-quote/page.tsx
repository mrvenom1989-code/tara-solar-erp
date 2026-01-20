// src/app/(admin)/documents/industrial-quote/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react"; 
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch"; 
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Check, X, Save, Loader2, ArrowLeft, Settings2, RefreshCcw } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

// --- TYPES ---
type TechRow = {
  component: string;
  spec: string;
  make: string;
};

type PaymentRow = {
  percent: string;
  stage: string;
};

function QuoteContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentDate, setCurrentDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. MASTER CONFIGURATION STATE
  const [data, setData] = useState({
    clientName: "Chemtech Intermediated Pvt Ltd",
    address: "GIDC, Ankleshwar, Gujarat", 
    capacity: "1000",
    rate: "31500",
    projectType: "Ground Mount",
    
    // Tech Config
    panelMake: "Waaree",
    panelSpec: "590Wp+ TopCon Bi-Facial",
    inverterMake: "Sungrow",
    inverterSpec: "String Inverters (Grid Tie)",
    moduleTypeSummary: "N-Type Bi-Facial", 

    // Configurable Scope Matrix
    scope: [
        { name: "Design & Engineering", isTara: true },
        { name: "Land Acquisition", isTara: false }, 
        { name: "Fencing", isTara: false },          
        { name: "Civil Foundations (Piling)", isTara: true },
        { name: "Liaisoning (GETCO/DISCOM)", isTara: true },
        { name: "Water & Construction Power", isTara: false }, 
    ]
  });

  // 2. DYNAMIC TABLE STATES
  const [techRows, setTechRows] = useState<TechRow[]>([]);
  
  const [paymentSupply, setPaymentSupply] = useState<PaymentRow[]>([
    { percent: "10%", stage: "Advance along with Work Order." },
    { percent: "60%", stage: "Against Proforma Invoice (Before Dispatch)." },
    { percent: "30%", stage: "Upon receipt of material at site (Prorata basis)." },
  ]);

  const [paymentService, setPaymentService] = useState<PaymentRow[]>([
    { percent: "20%", stage: "Advance for Mobilization." },
    { percent: "30%", stage: "On completion of Civil/Piling work." },
    { percent: "30%", stage: "On completion of Structure & Module mounting." },
    { percent: "10%", stage: "On Electrical Connectivity (Cabling/Inverter)." },
    { percent: "10%", stage: "On successful Commissioning / Handover." },
  ]);

  // 3. SMART SYNC
  useEffect(() => {
    if (loading) return;

    let rows: TechRow[] = [
        { component: "Solar Modules", spec: data.panelSpec, make: data.panelMake },
        { component: "Solar Inverter", spec: data.inverterSpec, make: data.inverterMake },
        { component: "Module Mounting Structure", spec: "Hot Dip Galvanized (80 micron)", make: "Tara Solar Fab / Reputed" },
        { component: "DC Cables", spec: "Solar Grade (4/6 sq mm)", make: "Polycab / RR / Apar" },
        { component: "AC Cables", spec: "Alu. Armored (LT/HT)", make: "Polycab / RR / Apar" },
        { component: "LT Panel / ACDB", spec: "Indoor/Outdoor Type", make: "Siemens / L&T / C&S" },
        { component: "Earthing Kit", spec: "Chemical Earthing (3m)", make: "Reputed" },
        { component: "Lightning Arrester", spec: "ESE Type (Copper)", make: "Reputed" },
        { component: "SCADA", spec: "Remote Monitoring Hardware", make: "SolarLog / Meteocontrol / Inbuilt" },
        { component: "Generation Meter", spec: "0.2s Class Accuracy", make: "Secure / L&T" },
        { component: "Main Meter (Net Meter)", spec: "0.2s Class Accuracy (Bi-Dir)", make: "Secure / L&T" },
    ];

    if (data.projectType === "Ground Mount") {
        rows.push(
            { component: "Inverter Duty Transformer", spec: "Oil Cooled (ONAN)", make: "Voltamp / T&R / Reputed" },
            { component: "Aux Transformer", spec: "Lighting/Aux Load", make: "Reputed" },
            { component: "HT Panel (11/33kV)", spec: "VCB / SF6 Breaker", make: "Siemens / ABB / C&S" },
            { component: "CCTV System", spec: "IP Cameras with NVR", make: "Hikvision / CP Plus" }
        );
    }

    setTechRows(rows);
  }, [data.projectType, data.panelMake, data.inverterMake, data.panelSpec, data.inverterSpec, loading]);


  // 4. HYDRATION
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString("en-IN"));
    
    const loadData = async () => {
        const quoteId = searchParams.get("id");
        const clientParam = searchParams.get("client");
        const capacityParam = searchParams.get("capacity");

        if (quoteId) {
            const { data: quote, error } = await supabase
                .from('quotations')
                .select('*')
                .eq('id', quoteId)
                .single();
            
            if (quote && quote.data_snapshot) {
                const snap = quote.data_snapshot;
                setData(snap);
                if(snap.techRows) setTechRows(snap.techRows);
                if(snap.paymentSupply) setPaymentSupply(snap.paymentSupply);
                if(snap.paymentService) setPaymentService(snap.paymentService);
            }
        } else if (clientParam) {
            setData(prev => ({
                ...prev,
                clientName: clientParam,
                capacity: capacityParam || prev.capacity
            }));
        }
        setLoading(false);
    };
    
    loadData();
  }, [searchParams]);

  // 5. HELPER FUNCTIONS
  const totalVal = parseFloat(data.capacity) * parseFloat(data.rate);
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
  };

  const toggleScope = (index: number) => {
      const newScope = [...data.scope];
      newScope[index].isTara = !newScope[index].isTara;
      setData({ ...data, scope: newScope });
  };

  const handleTableEdit = (setter: any, rows: any[], index: number, field: string, value: string) => {
      const newRows = [...rows];
      newRows[index][field] = value;
      setter(newRows);
  }

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('quotations').insert({
        client_name: data.clientName,
        type: 'Industrial',
        amount: `₹${formatCurrency(totalVal)}`,
        status: 'Generated',
        capacity: data.capacity,
        address: data.address, 
        data_snapshot: { ...data, techRows, paymentSupply, paymentService }    
    });

    if (error) {
        alert("Error saving: " + error.message);
        setSaving(false);
    } else {
        alert("Industrial Quote Saved!");
        router.push("/documents");
    }
  };

  if (loading) return <div className="flex justify-center h-screen items-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* 🖨️ PRINT STYLE - OPTIMIZED FOR SPACING */}
      <style type="text/css" media="print">
      {`
        @page { size: A4; margin: 0mm; }
        body { visibility: hidden; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        #print-area { visibility: visible; position: absolute; top: 0; left: 0; width: 210mm; min-height: 297mm; background: white; color: black; margin: 0; padding: 10mm 15mm; }
        ::-webkit-scrollbar { display: none; }
        .break-before { page-break-before: always; }
        .break-inside-avoid { page-break-inside: avoid; }
        tr, td, th, li { page-break-inside: avoid; } /* PREVENT ROW SPLITTING */
        input, textarea { border: none !important; padding: 0 !important; background: transparent !important; resize: none; }
      `}
      </style>

      {/* 1. CONFIGURATION CARD */}
      <div className="print:hidden">
        <Link href="/documents" className="text-slate-500 hover:text-slate-900 flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Documents
        </Link>
        
        <Card className="border-slate-200 shadow-md">
            <CardHeader className="bg-slate-100 border-b flex flex-row items-center gap-2">
                <Settings2 className="w-5 h-5 text-slate-500"/>
                <CardTitle>Industrial Quote Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left: Basic Info */}
                <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-500 uppercase border-b pb-2">Project Details</h4>
                    
                    <div className="flex gap-4 p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="pType" checked={data.projectType === 'Ground Mount'} onChange={() => setData({...data, projectType: 'Ground Mount'})} className="accent-blue-900 w-4 h-4" />
                            <span className="text-sm font-bold text-blue-900">Ground Mount</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="pType" checked={data.projectType === 'Roof Mount'} onChange={() => setData({...data, projectType: 'Roof Mount'})} className="accent-blue-900 w-4 h-4" />
                            <span className="text-sm font-bold text-blue-900">Roof Mount</span>
                        </label>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold block mb-1">Client Name</label>
                            <Input value={data.clientName} onChange={e => setData({...data, clientName: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold block mb-1">Site Address</label>
                            <Input value={data.address} onChange={e => setData({...data, address: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold block mb-1">Capacity (KW)</label>
                                <Input value={data.capacity} onChange={e => setData({...data, capacity: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold block mb-1 text-[#65A30D]">Rate/KWatt (₹)</label>
                                <Input value={data.rate} onChange={e => setData({...data, rate: e.target.value})} />
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 p-3 rounded border">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className="text-xs font-bold block mb-1">Module Make</label>
                                    <Select value={data.panelMake} onValueChange={(val) => setData({...data, panelMake: val})}>
                                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Waaree">Waaree</SelectItem>
                                            <SelectItem value="Adani">Adani</SelectItem>
                                            <SelectItem value="Goldi">Goldi</SelectItem>
                                            <SelectItem value="Axitec">Axitec</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold block mb-1">Module Spec</label>
                                    <Input className="h-8" value={data.panelSpec} onChange={e => setData({...data, panelSpec: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-bold block mb-1">Inverter Make</label>
                                    <Select value={data.inverterMake} onValueChange={(val) => setData({...data, inverterMake: val})}>
                                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Sungrow">Sungrow</SelectItem>
                                            <SelectItem value="Solis">Solis</SelectItem>
                                            <SelectItem value="Growatt">Growatt</SelectItem>
                                            <SelectItem value="GoodWe">GoodWe</SelectItem>
                                            <SelectItem value="Vsole">Vsole</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold block mb-1">Inverter Spec</label>
                                    <Input className="h-8" value={data.inverterSpec} onChange={e => setData({...data, inverterSpec: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Scope Matrix Config */}
                <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-500 uppercase border-b pb-2">Scope of Work Matrix</h4>
                    <div className="space-y-2 max-h-75 overflow-y-auto pr-2">
                        {data.scope.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded border text-sm">
                                <span>{item.name}</span>
                                <div className="flex items-center gap-2">
                                    <Label className={`text-xs ${!item.isTara ? 'font-bold text-blue-700' : 'text-slate-400'}`}>Client</Label>
                                    <Switch 
                                        checked={item.isTara}
                                        onCheckedChange={() => toggleScope(index)}
                                        className="data-[state=checked]:bg-[#65A30D]"
                                    />
                                    <Label className={`text-xs ${item.isTara ? 'font-bold text-[#65A30D]' : 'text-slate-400'}`}>Tara</Label>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 bg-yellow-50 text-xs text-yellow-800 rounded border border-yellow-100 flex gap-2">
                        <RefreshCcw className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                            <strong>Note:</strong> The "Technical Makes & Specs" table below automatically updates based on "Project Type". You can also edit table cells directly.
                        </div>
                    </div>
                </div>

                {/* Bottom: Actions */}
                <div className="md:col-span-2 pt-4 flex gap-3 border-t mt-2">
                    <Button variant="outline" className="w-full md:w-auto ml-auto" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" /> Print / PDF
                    </Button>
                    {!searchParams.get('id') && (
                        <Button className="w-full md:w-auto bg-blue-900 hover:bg-blue-800" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Record
                        </Button>
                    )}
                </div>

            </CardContent>
        </Card>
      </div>

      {/* 2. PRINTABLE DOCUMENT */}
      <div className="bg-white p-12 border shadow-xl print:shadow-none print:border-none text-slate-800 font-sans" id="print-area">
        
        {/* --- COVER PAGE --- */}
        {/* REDUCED MIN-HEIGHT TO PREVENT OVERFLOW ON A4 */}
        <div className="min-h-[260mm] flex flex-col justify-between">
             <div className="flex items-center gap-4 border-b-4 border-blue-900 pb-6">
                <div className="relative w-16 h-16">
                     <Image src="/logo.png" alt="Logo" width={64} height={64} className="object-contain" />
                </div>
                <div>
                     <h1 className="text-3xl font-bold text-blue-900 uppercase">Techno-Commercial Proposal</h1>
                     <p className="text-lg text-slate-600">Grid Connected {data.projectType} Solar Power Plant</p>
                </div>
             </div>

             <div className="my-12 text-center">
                 <div className="inline-block bg-blue-50 px-8 py-4 rounded-xl border border-blue-200">
                     <p className="text-sm text-slate-500 uppercase tracking-widest mb-2">Project Capacity</p>
                     <span className="font-bold text-5xl text-blue-900">{data.capacity} KWp</span>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-12 mb-20">
                 <div className="p-6 bg-slate-50 rounded-lg border-l-4 border-blue-900">
                     <p className="text-xs text-slate-500 uppercase font-bold mb-2">Prepared For</p>
                     <h2 className="text-2xl font-bold text-slate-900">{data.clientName}</h2>
                     <p>{data.address}</p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-lg border-l-4 border-[#65A30D]">
                     <p className="text-xs text-slate-500 uppercase font-bold mb-2">Submitted By</p>
                     <h2 className="text-2xl font-bold text-[#65A30D]">Tara Solar Energy</h2>
                     <p>EPC Division, Satlasana</p>
                     <p className="text-sm mt-2">+91 94289 56700</p>
                     <p className="text-sm mt-2">Date: {currentDate}</p>
                 </div>
             </div>
             
             <div className="text-center text-xs text-slate-400 pb-8">
                 <p>Tara Solar Energy | Private & Confidential</p>
             </div>
        </div>

        {/* --- PAGE 2: TECHNICAL DETAILS --- */}
        <div className="break-before pt-8">
            <h3 className="text-lg font-bold bg-slate-100 p-2 mb-4 border-l-4 border-blue-900">1. Project Technical Summary</h3>
            
            <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm mb-6">
                 <div className="flex justify-between border-b border-dashed py-1"><span>Plant Capacity (DC)</span><span className="font-bold">{data.capacity} KWp</span></div>
                 <div className="flex justify-between border-b border-dashed py-1 items-center">
                    <span>Module Type</span>
                    <input 
                        value={data.moduleTypeSummary} 
                        onChange={e => setData({...data, moduleTypeSummary: e.target.value})}
                        className="font-bold text-right w-1/2 focus:outline-none bg-transparent"
                    />
                 </div>
            </div>

            <h3 className="text-lg font-bold bg-slate-100 p-2 mb-4 border-l-4 border-blue-900">2. Technical Makes & Specs</h3>
            <table className="w-full text-sm border border-slate-300 mb-6">
                <thead className="bg-blue-900 text-white">
                    <tr>
                        <th className="p-2 text-left w-1/4">Component</th>
                        <th className="p-2 text-left">Specification</th>
                        <th className="p-2 text-left w-1/3">Preferred Make</th>
                    </tr>
                </thead>
                <tbody>
                    {techRows.map((row, index) => (
                        <tr key={index} className="border-b break-inside-avoid">
                            <td className="p-1 px-2 font-bold align-middle">
                                <input 
                                    value={row.component} 
                                    onChange={e => handleTableEdit(setTechRows, techRows, index, 'component', e.target.value)}
                                    className="w-full bg-transparent focus:outline-none font-bold"
                                />
                            </td>
                            <td className="p-1 px-2 align-middle">
                                <input 
                                    value={row.spec} 
                                    onChange={e => handleTableEdit(setTechRows, techRows, index, 'spec', e.target.value)}
                                    className="w-full bg-transparent focus:outline-none"
                                />
                            </td>
                            <td className="p-1 px-2 align-middle">
                                <input 
                                    value={row.make} 
                                    onChange={e => handleTableEdit(setTechRows, techRows, index, 'make', e.target.value)}
                                    className="w-full bg-transparent focus:outline-none"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h3 className="text-lg font-bold bg-slate-100 p-2 mb-4 border-l-4 border-blue-900">3. Scope Matrix</h3>
            <table className="w-full text-sm border border-slate-300">
                <thead className="bg-slate-200">
                    <tr>
                        <th className="p-2 text-left">Activity</th>
                        <th className="p-2 text-center w-24">Tara Solar</th>
                        <th className="p-2 text-center w-24">Client</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {data.scope.map((item, i) => (
                        <tr key={i} className="break-inside-avoid">
                            <td className="p-1 px-2">{item.name}</td>
                            <td className={`p-1 px-2 text-center ${item.isTara ? 'text-green-600' : 'text-slate-200'}`}>
                                {item.isTara ? <Check className="inline w-4 h-4"/> : <X className="inline w-4 h-4"/>}
                            </td>
                            <td className={`p-1 px-2 text-center ${!item.isTara ? 'text-blue-600' : 'text-slate-200'}`}>
                                {!item.isTara ? <Check className="inline w-4 h-4"/> : <X className="inline w-4 h-4"/>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* --- PAGE 3: COMMERCIALS --- */}
        <div className="break-before pt-8">
            <h3 className="text-lg font-bold bg-slate-100 p-2 mb-4 border-l-4 border-blue-900">4. Commercial Offer</h3>
            
            <div className="border border-slate-300 mb-6 break-inside-avoid">
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
                                 <strong>Turnkey EPC for {data.capacity} KWp Solar Power Plant</strong>
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

            <h3 className="text-lg font-bold bg-slate-100 p-2 mb-4 border-l-4 border-blue-900">5. Payment Terms</h3>
            <div className="space-y-6 text-sm">
                
                <div className="break-inside-avoid">
                    <h4 className="font-bold text-blue-900 border-b mb-2">A. Supply Portion</h4>
                    <ul className="pl-0 space-y-1">
                        {paymentSupply.map((row, i) => (
                            <li key={i} className="flex gap-2 break-inside-avoid">
                                <input 
                                    className="font-bold w-12 text-right bg-transparent focus:outline-none" 
                                    value={row.percent}
                                    onChange={e => handleTableEdit(setPaymentSupply, paymentSupply, i, 'percent', e.target.value)}
                                />
                                <input 
                                    className="flex-1 bg-transparent focus:outline-none" 
                                    value={row.stage}
                                    onChange={e => handleTableEdit(setPaymentSupply, paymentSupply, i, 'stage', e.target.value)}
                                />
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="break-inside-avoid">
                    <h4 className="font-bold text-blue-900 border-b mb-2">B. Installation Services</h4>
                    <ul className="pl-0 space-y-1">
                        {paymentService.map((row, i) => (
                            <li key={i} className="flex gap-2 break-inside-avoid">
                                <input 
                                    className="font-bold w-12 text-right bg-transparent focus:outline-none" 
                                    value={row.percent}
                                    onChange={e => handleTableEdit(setPaymentService, paymentService, i, 'percent', e.target.value)}
                                />
                                <input 
                                    className="flex-1 bg-transparent focus:outline-none" 
                                    value={row.stage}
                                    onChange={e => handleTableEdit(setPaymentService, paymentService, i, 'stage', e.target.value)}
                                />
                            </li>
                        ))}
                    </ul>
                </div>

            </div>

            <div className="mt-16 border-t pt-8 flex justify-between items-end break-inside-avoid">
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

export default function IndustrialQuoteGenerator() {
  return (
    <Suspense fallback={<div className="p-10 text-center flex items-center justify-center h-screen"><Loader2 className="animate-spin w-6 h-6 mr-2" /> Loading Document...</div>}>
      <QuoteContent />
    </Suspense>
  );
}