// src/app/(public)/quote/page.tsx
"use client";

import { useState } from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer"; // Added Footer
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { INVENTORY } from "@/app/_mock/inventory"; 
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function QuotePage() {
  const [step, setStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "Ahmedabad",
    billAmount: "",
    roofArea: "",
    panelPreference: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Quote Requested for ${formData.name}! We will call ${formData.phone}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col">
      <Navbar />

      {/* UNIFIED PAGE HEADER (Matches About & Subsidy Pages) */}
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
                        onClick={() => setStep(2)}
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
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="w-2/3 bg-[#65A30D] hover:bg-[#558b0b] text-white h-14 text-lg font-bold shadow-md rounded-lg"
                    >
                      Submit Request <CheckCircle2 className="ml-2 w-5 h-5"/>
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