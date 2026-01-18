// This acts as your "database" for now
export type Lead = {
  id: string;
  name: string;
  status: "New" | "Contacted" | "Quote Sent";
  roofSize: number;
  phone: string;
};

export const MOCK_LEADS: Lead[] = [
  {
    id: "1",
    name: "Rajesh Patel",
    status: "New",
    roofSize: 1200,
    phone: "+91 98765 43210",
  },
  {
    id: "2",
    name: "Green Industries Ltd",
    status: "Quote Sent",
    roofSize: 5000,
    phone: "+91 99887 76655",
  },
];