import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, Plus } from "lucide-react";
import { FamilyWithPayments } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FamilyForm from "@/components/forms/FamilyForm";
import PaymentForm from "@/components/forms/PaymentForm";
import { exportTableToExcel } from "@/lib/xlsx-utils";
import { useToast } from "@/hooks/use-toast";

export default function PaymentStatusTable() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<number | null>(null);
  const [openFamilyForm, setOpenFamilyForm] = useState(false);
  const [openPaymentForm, setOpenPaymentForm] = useState(false);
  const limit = 5;

  const { data, isLoading, error, refetch } = useQuery<{ families: FamilyWithPayments[], total: number }>({
    queryKey: ['/api/families/with-payments', { page, limit, query: searchQuery }],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const handleExport = () => {
    if (data?.families) {
      const headers = [
        "S.No", 
        "Name Head of Family", 
        "House No", 
        "Previous Balance", 
        "Annual Rate", 
        "Amount Received", 
        "Date", 
        "Status", 
        "Total Outstanding"
      ];
      
      const rows = data.families.map((family, index) => [
        (page - 1) * limit + index + 1,
        family.headOfFamily,
        family.houseNo,
        formatCurrency(family.latestPayment?.previousBalance || "0"),
        formatCurrency(family.latestPayment?.approvedFundRate || "0"),
        formatCurrency(family.latestPayment?.amountReceived || "0"),
        family.latestPayment?.paymentDate 
          ? new Date(family.latestPayment.paymentDate).toLocaleDateString() 
          : "-",
        getPaymentStatus(family),
        formatCurrency(family.latestPayment?.totalOutstanding || "0")
      ]);
      
      exportTableToExcel(headers, rows, "Payment_Status");
      
      toast({
        title: "Export Successful",
        description: "Payment status data has been exported to Excel.",
      });
    }
  };

  const handleAddNew = () => {
    setOpenFamilyForm(true);
  };

  const handleSelectFamily = (familyId: number) => {
    setSelectedFamily(familyId);
    setOpenPaymentForm(true);
  };

  const getPaymentStatus = (family: FamilyWithPayments) => {
    if (!family.latestPayment) return "Unpaid";
    
    const amountReceived = parseFloat(family.latestPayment.amountReceived || "0");
    const prevBalance = parseFloat(family.latestPayment.previousBalance || "0");
    const approvedRate = parseFloat(family.latestPayment.approvedFundRate || "0");
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

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment Status</CardTitle>
          <div className="flex items-center space-x-2">
            <form onSubmit={handleSearch} className="flex items-center">
              <Input
                className="mr-2"
                placeholder="Search families..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" variant="secondary" size="sm">Search</Button>
            </form>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button 
              size="sm"
              className="flex items-center gap-1"
              onClick={handleAddNew}
            >
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Name Head of Family</TableHead>
                  <TableHead>House No</TableHead>
                  <TableHead>Previous Balance</TableHead>
                  <TableHead>Annual Rate</TableHead>
                  <TableHead>Amount Received</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell colSpan={9}>
                        <div className="h-10 bg-gray-100 rounded"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-red-500">
                      Error loading payment data
                    </TableCell>
                  </TableRow>
                ) : data?.families.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      No families found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.families.map((family, index) => (
                    <TableRow key={family.id} className="hover:bg-gray-50">
                      <TableCell>{(page - 1) * limit + index + 1}</TableCell>
                      <TableCell className="font-medium">{family.headOfFamily}</TableCell>
                      <TableCell>{family.houseNo}</TableCell>
                      <TableCell>{formatCurrency(family.latestPayment?.previousBalance || "0")}</TableCell>
                      <TableCell>{formatCurrency(family.latestPayment?.approvedFundRate || "0")}</TableCell>
                      <TableCell>{formatCurrency(family.latestPayment?.amountReceived || "0")}</TableCell>
                      <TableCell>
                        {family.latestPayment?.paymentDate 
                          ? new Date(family.latestPayment.paymentDate).toLocaleDateString() 
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {renderPaymentStatusBadge(getPaymentStatus(family))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="link" 
                          className="text-primary hover:text-primary-dark mr-3"
                          onClick={() => handleSelectFamily(family.id)}
                        >
                          Record Payment
                        </Button>
                        <Button variant="ghost">View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(page * limit, data?.total || 0)}
                  </span>{" "}
                  of <span className="font-medium">{data?.total}</span> results
                </p>
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    />
                  </PaginationItem>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink
                          isActive={page === pageNumber}
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <PaginationItem>
                        <PaginationLink>...</PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink onClick={() => setPage(totalPages)}>
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Family Form Dialog */}
      <Dialog open={openFamilyForm} onOpenChange={setOpenFamilyForm}>
        <DialogContent className="sm:max-w-[600px]">
          <FamilyForm 
            onSuccess={() => {
              setOpenFamilyForm(false);
              refetch();
            }} 
            onCancel={() => setOpenFamilyForm(false)} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Payment Form Dialog */}
      <Dialog open={openPaymentForm} onOpenChange={setOpenPaymentForm}>
        <DialogContent className="sm:max-w-[600px]">
          <PaymentForm 
            familyId={selectedFamily}
            onSuccess={() => {
              setOpenPaymentForm(false);
              refetch();
            }} 
            onCancel={() => setOpenPaymentForm(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
