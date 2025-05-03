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
import { Family } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import FamilyForm from "@/components/forms/FamilyForm";
import PaymentForm from "@/components/forms/PaymentForm";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { exportTableToExcel } from "@/lib/xlsx-utils";

export default function Families() {
  const { toast } = useToast();
  const [openFamilyForm, setOpenFamilyForm] = useState(false);
  const [openPaymentForm, setOpenPaymentForm] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<number | null>(null);
  
  const { data, isLoading, refetch } = useQuery<{ families: Family[], total: number }>({
    queryKey: ['/api/families', { limit: 100 }],
  });
  
  const handleAddNew = () => {
    setOpenFamilyForm(true);
  };
  
  const handleRecordPayment = (familyId: number) => {
    setSelectedFamily(familyId);
    setOpenPaymentForm(true);
  };
  
  const handleEditFamily = (familyId: number) => {
    setSelectedFamily(familyId);
    setOpenFamilyForm(true);
  };
  
  const handleDeleteFamily = async (familyId: number) => {
    if (window.confirm("Are you sure you want to delete this family? This will also delete all their payment records.")) {
      try {
        await apiRequest("DELETE", `/api/families/${familyId}`);
        toast({
          title: "Success",
          description: "Family has been deleted successfully",
        });
        refetch();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete family",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleExport = () => {
    if (data?.families) {
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
      
      const rows = data.families.map(family => [
        family.id,
        family.headOfFamily,
        family.parentage || "",
        family.successor1st || "",
        family.successor2nd || "",
        family.address,
        family.houseNo,
        family.mobileNo
      ]);
      
      exportTableToExcel(headers, rows, "Families_List");
      
      toast({
        title: "Export Successful",
        description: "Families data has been exported to Excel.",
      });
    }
  };
  
  const columns: ColumnDef<Family>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "headOfFamily",
      header: "Name Head of Family",
    },
    {
      accessorKey: "parentage",
      header: "Parentage",
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
      id: "actions",
      cell: ({ row }) => {
        const family = row.original;
        return (
          <div className="flex space-x-2">
            <Button 
              variant="link" 
              className="text-primary hover:text-primary-dark"
              onClick={() => handleRecordPayment(family.id)}
            >
              Record Payment
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleEditFamily(family.id)}
            >
              Edit
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-red-500 hover:text-red-700"
              onClick={() => handleDeleteFamily(family.id)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Families</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleExport}
              disabled={isLoading || !data?.families.length}
            >
              <span className="material-icons text-sm mr-2">file_download</span>
              Export
            </Button>
            <Button onClick={handleAddNew}>
              <span className="material-icons text-sm mr-2">add</span>
              Add New Family
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading families...</div>
          ) : data?.families.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No families registered yet</p>
              <Button onClick={handleAddNew}>Add Your First Family</Button>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={data?.families || []} 
              searchColumn="headOfFamily"
              searchPlaceholder="Search by name..."
            />
          )}
        </CardContent>
      </Card>
      
      {/* Family Form Dialog */}
      <Dialog open={openFamilyForm} onOpenChange={setOpenFamilyForm}>
        <DialogContent className="sm:max-w-[600px]">
          <FamilyForm 
            familyId={selectedFamily}
            onSuccess={() => {
              setOpenFamilyForm(false);
              setSelectedFamily(null);
              refetch();
            }} 
            onCancel={() => {
              setOpenFamilyForm(false);
              setSelectedFamily(null);
            }} 
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
              setSelectedFamily(null);
              refetch();
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
