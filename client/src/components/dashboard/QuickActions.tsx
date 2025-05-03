import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FamilyForm from "@/components/forms/FamilyForm";
import PaymentForm from "@/components/forms/PaymentForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function QuickActions() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openFamilyForm, setOpenFamilyForm] = useState(false);
  const [openPaymentForm, setOpenPaymentForm] = useState(false);
  
  const handleAddFamilySuccess = () => {
    setOpenFamilyForm(false);
    toast({
      title: "Success!",
      description: "Family has been added successfully.",
      variant: "default",
    });
    queryClient.invalidateQueries({ queryKey: ['/api/families'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
  };
  
  const handleRecordPaymentSuccess = () => {
    setOpenPaymentForm(false);
    toast({
      title: "Success!",
      description: "Payment has been recorded successfully.",
      variant: "default",
    });
    queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activity'] });
  };
  
  const handleGenerateReport = () => {
    navigate("/reports");
  };
  
  const handleExportData = () => {
    // This will be implemented in reports page
    navigate("/reports");
  };
  
  const handleSendReminders = () => {
    toast({
      title: "Reminders Sent",
      description: "Payment reminders have been sent to families with outstanding dues.",
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full flex items-center justify-between bg-primary text-white p-6 rounded-lg hover:bg-primary-dark"
            onClick={() => setOpenFamilyForm(true)}
          >
            <span className="flex items-center">
              <span className="material-icons mr-2">add_circle</span>
              Add New Family
            </span>
            <span className="material-icons">arrow_forward</span>
          </Button>
          
          <Button 
            variant="outline"
            className="w-full flex items-center justify-between border-primary text-primary p-6 rounded-lg hover:bg-primary-light/10"
            onClick={() => setOpenPaymentForm(true)}
          >
            <span className="flex items-center">
              <span className="material-icons mr-2">receipt_long</span>
              Record Payment
            </span>
            <span className="material-icons">arrow_forward</span>
          </Button>
          
          <Button 
            variant="outline"
            className="w-full flex items-center justify-between border-gray-300 text-gray-700 p-6 rounded-lg hover:bg-gray-50"
            onClick={handleGenerateReport}
          >
            <span className="flex items-center">
              <span className="material-icons mr-2">summarize</span>
              Generate Report
            </span>
            <span className="material-icons">arrow_forward</span>
          </Button>
          
          <Button 
            variant="outline"
            className="w-full flex items-center justify-between border-gray-300 text-gray-700 p-6 rounded-lg hover:bg-gray-50"
            onClick={handleExportData}
          >
            <span className="flex items-center">
              <span className="material-icons mr-2">download</span>
              Export Data
            </span>
            <span className="material-icons">arrow_forward</span>
          </Button>
          
          <Button 
            variant="outline"
            className="w-full flex items-center justify-between border-gray-300 text-gray-700 p-6 rounded-lg hover:bg-gray-50"
            onClick={handleSendReminders}
          >
            <span className="flex items-center">
              <span className="material-icons mr-2">notifications_active</span>
              Send Reminders
            </span>
            <span className="material-icons">arrow_forward</span>
          </Button>
        </CardContent>
      </Card>
      
      {/* Family Form Dialog */}
      <Dialog open={openFamilyForm} onOpenChange={setOpenFamilyForm}>
        <DialogContent className="sm:max-w-[600px]">
          <FamilyForm onSuccess={handleAddFamilySuccess} onCancel={() => setOpenFamilyForm(false)} />
        </DialogContent>
      </Dialog>
      
      {/* Payment Form Dialog */}
      <Dialog open={openPaymentForm} onOpenChange={setOpenPaymentForm}>
        <DialogContent className="sm:max-w-[600px]">
          <PaymentForm onSuccess={handleRecordPaymentSuccess} onCancel={() => setOpenPaymentForm(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
