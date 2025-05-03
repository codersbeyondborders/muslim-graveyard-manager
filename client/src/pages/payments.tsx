import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Payment } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import PaymentForm from "@/components/forms/PaymentForm";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { exportTableToExcel } from "@/lib/xlsx-utils";

export default function Payments() {
  const { toast } = useToast();
  const [openPaymentForm, setOpenPaymentForm] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<number | null>(null);
  
  const { data: payments, isLoading: paymentsLoading, refetch: refetchPayments } = useQuery<Payment[]>({
    queryKey: ['/api/payments'],
  });
  
  const { data: familiesData } = useQuery<{ families: any[], total: number }>({
    queryKey: ['/api/families', { limit: 100 }],
  });
  
  const getFamilyName = (familyId: number) => {
    const family = familiesData?.families.find(f => f.id === familyId);
    return family ? `${family.headOfFamily} (House #${family.houseNo})` : `Family ID: ${familyId}`;
  };
  
  const handleRecordPayment = () => {
    setOpenPaymentForm(true);
  };
  
  const getPaymentStatus = (payment: Payment) => {
    const amountReceived = parseFloat(payment.amountReceived || "0");
    const prevBalance = parseFloat(payment.previousBalance || "0");
    const approvedRate = parseFloat(payment.approvedFundRate || "0");
    const total = prevBalance + approvedRate;
    
    if (amountReceived === 0) return "Unpaid";
    if (amountReceived < total) return "Partial";
    return "Paid";
  };
  
  const renderPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case "Partial":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Partial</Badge>;
      case "Unpaid":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Unpaid</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  const handleExport = () => {
    if (payments) {
      const headers = [
        "ID", 
        "Family", 
        "Previous Balance", 
        "Approved Rate", 
        "Amount Received", 
        "Receipt No", 
        "Payment Date", 
        "Balance", 
        "Total Outstanding",
        "Status"
      ];
      
      const rows = payments.map(payment => [
        payment.id,
        getFamilyName(payment.familyId),
        formatCurrency(payment.previousBalance),
        formatCurrency(payment.approvedFundRate),
        formatCurrency(payment.amountReceived),
        payment.receiptNo || "",
        payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : "",
        formatCurrency(payment.balance),
        formatCurrency(payment.totalOutstanding),
        getPaymentStatus(payment)
      ]);
      
      exportTableToExcel(headers, rows, "Payments_List");
      
      toast({
        title: "Export Successful",
        description: "Payments data has been exported to Excel.",
      });
    }
  };
  
  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      id: "family",
      header: "Family",
      cell: ({ row }) => getFamilyName(row.original.familyId),
    },
    {
      accessorKey: "previousBalance",
      header: "Previous Balance",
      cell: ({ row }) => formatCurrency(row.original.previousBalance),
    },
    {
      accessorKey: "approvedFundRate",
      header: "Approved Rate",
      cell: ({ row }) => formatCurrency(row.original.approvedFundRate),
    },
    {
      accessorKey: "amountReceived",
      header: "Amount Received",
      cell: ({ row }) => formatCurrency(row.original.amountReceived),
    },
    {
      accessorKey: "paymentDate",
      header: "Payment Date",
      cell: ({ row }) => row.original.paymentDate 
        ? new Date(row.original.paymentDate).toLocaleDateString() 
        : "-",
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => renderPaymentStatusBadge(getPaymentStatus(row.original)),
    },
    {
      accessorKey: "totalOutstanding",
      header: "Outstanding",
      cell: ({ row }) => formatCurrency(row.original.totalOutstanding),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payments</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleExport}
              disabled={paymentsLoading || !payments?.length}
            >
              <span className="material-icons text-sm mr-2">file_download</span>
              Export
            </Button>
            <Button onClick={handleRecordPayment}>
              <span className="material-icons text-sm mr-2">add</span>
              Record Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="text-center py-4">Loading payments...</div>
          ) : !payments?.length ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No payments recorded yet</p>
              <Button onClick={handleRecordPayment}>Record Your First Payment</Button>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={payments || []}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Payment Form Dialog */}
      <Dialog open={openPaymentForm} onOpenChange={setOpenPaymentForm}>
        <DialogContent className="sm:max-w-[600px]">
          <PaymentForm 
            familyId={selectedFamily}
            onSuccess={() => {
              setOpenPaymentForm(false);
              setSelectedFamily(null);
              refetchPayments();
            }} 
            onCancel={() => {
              setOpenPaymentForm(false);
              setSelectedFamily(null);
            }} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
