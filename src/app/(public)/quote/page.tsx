// src/app/(public)/quote/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { INVENTORY } from "@/app/_mock/inventory"; 
import { CheckCircle2, ArrowRight, Loader2, PartyPopper } from "lucide-react";
import { createClient } from "@/utils/supabase/client"; // 1. Import Supabase

export default function QuotePage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "Ahmedabad",
    billAmount: "",
    roofArea: "",
    panelPreference: "recommend",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 2. Calculate Estimated Capacity (Logic: ~Rs 800 bill per 1kW)
    const bill = parseFloat(formData.billAmount) || 0;
    const estimatedKw = (bill / 850).toFixed(2); 

    // 3. Insert into Supabase 'leads' table
    const { error } = await supabase.from('leads').insert({
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
        capacity: estimatedKw, // Auto-calculated based on bill
        type: 'Residential',   // Default for public website quotes
        status: 'New'
    });

    if (error) {
        alert("Error submitting request: " + error.message);
        setLoading(false);
    } else {
        setLoading(false);
        setSuccess(true); // Show success screen
    }
  };

  // SUCCESS SCREEN RENDER
  if (success) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col">
          <Navbar />
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center p-8 border-green-200 bg-green-50">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <PartyPopper className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-green-800 mb-2">Request Received!</h2>
                <p className="text-green-700 mb-8">
                    Thank you, {formData.name}. Our solar engineer will review your requirements and call you at {formData.phone} shortly.
                </p>
                <Button className="w-full bg-[#65A30D] hover:bg-[#558b0b]" onClick={() => router.push("/")}>
                    Back to Home
                </Button>
            </Card>
          </div>
          <Footer />
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col">
      <Navbar />

      {/* UNIFIED PAGE HEADER */}
      <section className="bg-[#65A30D]/10 py-20 text-center border-b border-green-100 dark:border-green-900">
        <div className="container px-4 mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-5xl">
            Get Your Solar Quote
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Step {step} of 2: {step === 1 ? "Property Details" : "Contact Information"}
          </p>
        </div>
      </section>

      {/* FORM SECTION */}
      <section className="py-16 container px-4 mx-auto max-w-2xl flex-1">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          
          {/* Progress Bar Strip */}
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800">
            <div 
                className="h-full bg-[#65A30D] transition-all duration-500 ease-in-out" 
                style={{ width: step === 1 ? "50%" : "100%" }}
            ></div>
          </div>

          <CardHeader className="bg-white dark:bg-slate-900 pt-8 pb-2">
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              {step === 1 ? (
                 <>
                   <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-[#65A30D] text-sm">1</span>
                   Calculate Your Needs
                 </>
              ) : (
                 <>
                   <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-[#65A30D] text-sm">2</span>
                   Contact Details
                 </>
              )}
            </CardTitle>
            <CardDescription className="pl-11 text-slate-500">
               {step === 1 ? "Based on Gujarat Energy Development Agency (GEDA) standards." : "We'll send the detailed proposal to this contact."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6 pl-8 pr-8 pb-8 bg-white dark:bg-slate-900">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* STEP 1: TECHNICAL DETAILS */}
              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="billAmount">Monthly Electricity Bill (₹)</Label>
                      <Input 
                        id="billAmount" 
                        name="billAmount" 
                        type="number" 
                        placeholder="e.g. 4500" 
                        className="h-12 text-lg"
                        value={formData.billAmount}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roofArea">Available Roof Area (Sq. ft)</Label>
                      <Input 
                        id="roofArea" 
                        name="roofArea" 
                        type="number" 
                        placeholder="e.g. 500" 
                        className="h-12 text-lg"
                        value={formData.roofArea}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Panel Brand</Label>
                    <Select onValueChange={(val) => handleSelectChange("panelPreference", val)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select Brand (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {INVENTORY.filter(i => i.type === "Panel").map((item) => (
                          <SelectItem key={item.id} value={item.name}>
                            {item.name} - ₹{item.price}/panel
                          </SelectItem>
                        ))}
                        <SelectItem value="recommend">I don't know, recommend for me</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4">
                    <Button 
                        type="button" 
                        className="w-full bg-[#65A30D] hover:bg-[#558b0b] text-white h-14 text-lg font-bold shadow-md rounded-lg"
                        onClick={() => {
                            if(!formData.billAmount) alert("Please enter bill amount");
                            else setStep(2);
                        }}
                    >
                        Next Step <ArrowRight className="ml-2 w-5 h-5"/>
                    </Button>
                  </div>
                </>
              )}

              {/* STEP 2: CONTACT DETAILS */}
              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="e.g. Rajesh Shah" 
                      className="h-12 text-lg"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        placeholder="+91 98765 00000" 
                        className="h-12 text-lg"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Select onValueChange={(val) => handleSelectChange("city", val)} defaultValue="Ahmedabad">
                        <SelectTrigger className="h-12 text-lg">
                          <SelectValue placeholder="Select City" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ahmedabad">Ahmedabad</SelectItem>
                          <SelectItem value="Surat">Surat</SelectItem>
                          <SelectItem value="Vadodara">Vadodara</SelectItem>
                          <SelectItem value="Rajkot">Rajkot</SelectItem>
                          <SelectItem value="Gandhinagar">Gandhinagar</SelectItem>
                          <SelectItem value="Mehsana">Mehsana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-1/3 h-14 text-lg border-slate-300"
                      onClick={() => setStep(1)}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="w-2/3 bg-[#65A30D] hover:bg-[#558b0b] text-white h-14 text-lg font-bold shadow-md rounded-lg"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>Submit Request <CheckCircle2 className="ml-2 w-5 h-5"/></>}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
}