// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client"; // Import Supabase
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Sun, Lock, Mail, ArrowRight, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. REAL AUTHENTICATION
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError) {
      // 2. Handle Failure
      setError(authError.message === "Invalid login credentials" 
        ? "Invalid email or password." 
        : authError.message);
      setLoading(false);
    } else {
      // 3. Handle Success
      router.push("/dashboard");
      router.refresh(); // Refresh to ensure Sidebar updates
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-[#65A30D] skew-y-3 origin-top-left z-0"></div>
      
      <Card className="w-full max-w-md z-10 shadow-xl border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto bg-white p-3 rounded-full w-16 h-16 flex items-center justify-center shadow-sm mb-2">
                <Sun className="w-8 h-8 text-[#F59E0B]" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Tara Solar ERP</CardTitle>
            <p className="text-sm text-slate-500">Enter your credentials to access the dashboard</p>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
                
                {/* Error Message Display */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="admin@tarasolar.com" 
                            className="pl-9"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        
                        {/* Password Toggle */}
                        <Input 
                            id="password" 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="pl-9 pr-10" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>
                
                <Button className="w-full bg-[#65A30D] hover:bg-[#558b0b] text-white" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
                        </>
                    ) : (
                        <>
                            Sign In <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>

                <div className="text-center text-xs text-slate-400 mt-4">
                    Protected System. Authorized Personnel Only.
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}