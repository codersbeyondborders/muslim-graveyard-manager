import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { FamilyWithPayments, Payment } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { exportTableToExcel } from "@/lib/xlsx-utils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function Reports() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("all-families");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  
  // Fetch data for reports
  const { data: familiesData } = useQuery<{ families: FamilyWithPayments[], total: number }>({
    queryKey: ['/api/families/with-payments', { limit: 1000 }],
  });
  
  const { data: paymentsData } = useQuery<Payment[]>({
    queryKey: ['/api/payments'],
  });
  
  // Format payment status counts for pie chart
  const getPaymentStatusData = () => {
    if (!familiesData?.families) return [];
    
    const paid = familiesData.families.filter(f => 
      f.latestPayment && 
      Number(f.latestPayment.amountReceived) >= 
      (Number(f.latestPayment.previousBalance) + Number(f.latestPayment.approvedFundRate))
    ).length;
    
    const partial = familiesData.families.filter(f => 
      f.latestPayment && 
      Number(f.latestPayment.amountReceived) > 0 &&
      Number(f.latestPayment.amountReceived) < 
      (Number(f.latestPayment.previousBalance) + Number(f.latestPayment.approvedFundRate))
    ).length;
    
    const unpaid = familiesData.families.filter(f => 
      !f.latestPayment || Number(f.latestPayment.amountReceived) === 0
    ).length;
    
    return [
      { name: 'Paid', value: paid, color: '#4caf50' },
      { name: 'Partial', value: partial, color: '#ff9800' },
      { name: 'Unpaid', value: unpaid, color: '#f44336' }
    ];
  };
  
  // Format collection data by month for bar chart
  const getCollectionsByMonth = () => {
    if (!paymentsData) return [];
    
    // Filter payments by selected year
    const paymentsInYear = paymentsData.filter(p => 
      p.paymentDate && new Date(p.paymentDate).getFullYear() === parseInt(year)
    );
    
    // Group by month
    const monthlyData: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months with 0
    months.forEach((month, index) => {
      monthlyData[month] = 0;
    });
    
    // Sum payments by month
    paymentsInYear.forEach(payment => {
      if (payment.paymentDate) {
        const month = new Date(payment.paymentDate).getMonth();
        monthlyData[months[month]] += Number(payment.amountReceived);
      }
    });
    
    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount
    }));
  };
  
  // Export reports
  const handleExportReport = () => {
    switch (reportType) {
      case "all-families":
        exportFamiliesReport();
        break;
      case "payment-status":
        exportPaymentStatusReport();
        break;
      case "outstanding":
        exportOutstandingReport();
        break;
      default:
        toast({
          title: "Error",
          description: "Invalid report type selected",
          variant: "destructive",
        });
    }
  };
  
  const exportFamiliesReport = () => {
    if (familiesData?.families) {
      const headers = [
        "ID", 
        "Name Head of Family", 
        "Parentage", 
        "Successor 1st", 
        "Successor 2nd", 
        "Address", 
        "House No", 
        "Mobile No"
      ];
      
      const rows = familiesData.families.map(family => [
        family.id,
        family.headOfFamily,
        family.parentage || "",
        family.successor1st || "",
        family.successor2nd || "",
        family.address,
        family.houseNo,
        family.mobileNo
      ]);
      
      exportTableToExcel(headers, rows, "Complete_Families_Report");
      
      toast({
        title: "Export Successful",
        description: "Families report has been exported to Excel.",
      });
    }
  };
  
  const exportPaymentStatusReport = () => {
    if (familiesData?.families) {
      const headers = [
        "ID", 
        "Name Head of Family", 
        "House No", 
        "Previous Balance", 
        "Annual Rate", 
        "Amount Received", 
        "Payment Date", 
        "Status",
        "Outstanding Amount"
      ];
      
      const rows = familiesData.families.map(family => {
        const status = !family.latestPayment ? "Unpaid" :
          Number(family.latestPayment.amountReceived) >= 
          (Number(family.latestPayment.previousBalance) + Number(family.latestPayment.approvedFundRate))
            ? "Paid"
            : Number(family.latestPayment.amountReceived) > 0 ? "Partial" : "Unpaid";
            
        return [
          family.id,
          family.headOfFamily,
          family.houseNo,
          formatCurrency(family.latestPayment?.previousBalance || "0"),
          formatCurrency(family.latestPayment?.approvedFundRate || "0"),
          formatCurrency(family.latestPayment?.amountReceived || "0"),
          family.latestPayment?.paymentDate 
            ? new Date(family.latestPayment.paymentDate).toLocaleDateString() 
            : "-",
          status,
          formatCurrency(family.latestPayment?.totalOutstanding || "0")
        ];
      });
      
      exportTableToExcel(headers, rows, "Payment_Status_Report");
      
      toast({
        title: "Export Successful",
        description: "Payment status report has been exported to Excel.",
      });
    }
  };
  
  const exportOutstandingReport = () => {
    if (familiesData?.families) {
      // Filter only families with outstanding balances
      const familiesWithOutstanding = familiesData.families.filter(
        f => f.latestPayment && Number(f.latestPayment.totalOutstanding) > 0
      );
      
      const headers = [
        "ID", 
        "Name Head of Family", 
        "House No", 
        "Mobile No",
        "Previous Balance", 
        "Annual Rate", 
        "Amount Received", 
        "Outstanding Amount"
      ];
      
      const rows = familiesWithOutstanding.map(family => [
        family.id,
        family.headOfFamily,
        family.houseNo,
        family.mobileNo,
        formatCurrency(family.latestPayment?.previousBalance || "0"),
        formatCurrency(family.latestPayment?.approvedFundRate || "0"),
        formatCurrency(family.latestPayment?.amountReceived || "0"),
        formatCurrency(family.latestPayment?.totalOutstanding || "0")
      ]);
      
      exportTableToExcel(headers, rows, "Outstanding_Dues_Report");
      
      toast({
        title: "Export Successful",
        description: "Outstanding dues report has been exported to Excel.",
      });
    }
  };
  
  // Columns for various reports
  const familyColumns: ColumnDef<FamilyWithPayments>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "headOfFamily",
      header: "Name Head of Family",
    },
    {
      accessorKey: "houseNo",
      header: "House No",
    },
    {
      accessorKey: "mobileNo",
      header: "Mobile No",
    },
    {
      accessorKey: "address",
      header: "Address",
    }
  ];
  
  const outstandingColumns: ColumnDef<FamilyWithPayments>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "headOfFamily",
      header: "Name Head of Family",
    },
    {
      accessorKey: "houseNo",
      header: "House No",
    },
    {
      id: "outstanding",
      header: "Outstanding Amount",
      cell: ({ row }) => formatCurrency(row.original.latestPayment?.totalOutstanding || "0"),
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <CardTitle>Reports</CardTitle>
            <div className="flex mt-4 md:mt-0 space-x-2">
              <Select
                value={reportType}
                onValueChange={setReportType}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select report" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-families">All Families</SelectItem>
                  <SelectItem value="payment-status">Payment Status</SelectItem>
                  <SelectItem value="outstanding">Outstanding Dues</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={handleExportReport}>
                <span className="material-icons text-sm mr-2">file_download</span>
                Export Report
              </Button>
            </div>
          </div>
          <CardDescription>
            Generate and export various reports for Intizamia Sonwar management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="visualizations" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
              <TabsTrigger value="data">Data View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="visualizations">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Payment Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPaymentStatusData()}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getPaymentStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} families`, 'Count']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                {/* Monthly Collections */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Monthly Collections</CardTitle>
                    <Select
                      value={year}
                      onValueChange={setYear}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getCollectionsByMonth()}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatCurrency(value.toString()), 'Amount']} />
                        <Legend />
                        <Bar dataKey="amount" name="Collection Amount" fill="#1976d2" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="data">
              <div className="mt-6">
                {reportType === "all-families" && (
                  <>
                    <h3 className="font-medium mb-4">All Registered Families</h3>
                    {familiesData?.families ? (
                      <DataTable 
                        columns={familyColumns} 
                        data={familiesData.families} 
                        searchColumn="headOfFamily"
                        searchPlaceholder="Search by name..."
                      />
                    ) : (
                      <div className="text-center py-4">Loading data...</div>
                    )}
                  </>
                )}
                
                {reportType === "payment-status" && (
                  <>
                    <h3 className="font-medium mb-4">Payment Status Report</h3>
                    {getPaymentStatusData().length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {getPaymentStatusData().map((status) => (
                          <Card key={status.name}>
                            <CardContent className="p-6">
                              <div className="text-2xl font-bold">{status.value}</div>
                              <div className="text-sm text-gray-500">{status.name} Families</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">Loading data...</div>
                    )}
                  </>
                )}
                
                {reportType === "outstanding" && (
                  <>
                    <h3 className="font-medium mb-4">Families with Outstanding Dues</h3>
                    {familiesData?.families ? (
                      <DataTable 
                        columns={outstandingColumns} 
                        data={familiesData.families.filter(
                          f => f.latestPayment && Number(f.latestPayment.totalOutstanding) > 0
                        )} 
                        searchColumn="headOfFamily"
                        searchPlaceholder="Search by name..."
                      />
                    ) : (
                      <div className="text-center py-4">Loading data...</div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
