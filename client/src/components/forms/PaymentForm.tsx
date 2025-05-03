import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPaymentSchema } from "@shared/schema";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

interface PaymentFormProps {
  familyId?: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// Extend the schema with validation
const formSchema = insertPaymentSchema
  .omit({ familyId: true })
  .extend({
    familyId: z.string().min(1, "Please select a family"),
    amountReceived: z.string().min(1, "Amount is required"),
    receiptNo: z.string().min(1, "Receipt number is required")
  });

export default function PaymentForm({ familyId, onSuccess, onCancel }: PaymentFormProps) {
  const { toast } = useToast();
  const [previousPayments, setPreviousPayments] = useState<any[]>([]);
  const [totalDue, setTotalDue] = useState<number>(0);
  
  // Fetch families for dropdown
  const { data: familiesData } = useQuery<{ families: any[], total: number }>({
    queryKey: ['/api/families', { limit: 100 }],
  });
  
  // Form definition
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      familyId: familyId ? String(familyId) : "",
      previousBalance: "0",
      approvedFundRate: "2500",
      amountReceived: "",
      receiptNo: "",
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ""
    },
  });
  
  // When familyId changes, fetch previous payments
  useEffect(() => {
    if (familyId) {
      form.setValue("familyId", String(familyId));
      fetchFamilyPayments(familyId);
    }
  }, [familyId, form]);
  
  const fetchFamilyPayments = async (id: number) => {
    try {
      const response = await fetch(`/api/payments?familyId=${id}`);
      if (response.ok) {
        const payments = await response.json();
        setPreviousPayments(payments);
        
        // Set previous balance from latest payment's outstanding amount
        if (payments && payments.length > 0) {
          const latestPayment = payments[0];
          form.setValue("previousBalance", latestPayment.totalOutstanding || "0");
          calculateTotalDue(latestPayment.totalOutstanding || "0");
        } else {
          form.setValue("previousBalance", "0");
          calculateTotalDue("0");
        }
      }
    } catch (error) {
      console.error("Error fetching family payments:", error);
    }
  };
  
  // On family selection change
  const handleFamilyChange = (value: string) => {
    form.setValue("familyId", value);
    fetchFamilyPayments(parseInt(value));
  };
  
  // Calculate total due amount
  const calculateTotalDue = (prevBalance: string) => {
    const previousBalance = parseFloat(prevBalance || "0");
    const approvedRate = parseFloat(form.getValues("approvedFundRate") || "0");
    setTotalDue(previousBalance + approvedRate);
  };
  
  // Update total due when previous balance or approved rate changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "previousBalance" || name === "approvedFundRate") {
        calculateTotalDue(value.previousBalance as string);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);
  
  // Create payment mutation
  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const paymentData = {
        ...values,
        familyId: parseInt(values.familyId)
      };
      
      const response = await apiRequest("POST", "/api/payments", paymentData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment has been successfully recorded",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values);
  };
  
  return (
    <div>
      <div className="text-xl font-semibold mb-6">Record Payment</div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="familyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Family</FormLabel>
                <Select 
                  onValueChange={handleFamilyChange} 
                  value={field.value}
                  disabled={!!familyId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a family" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {familiesData?.families?.map((family) => (
                      <SelectItem key={family.id} value={String(family.id)}>
                        {family.headOfFamily} (House #{family.houseNo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="previousBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Balance</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="approvedFundRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Approved Fund Rate</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col">
              <FormLabel>Total Due</FormLabel>
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-gray-100 flex items-center">
                {formatCurrency(totalDue.toString())}
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="amountReceived"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Received</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="receiptNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt No</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Add payment notes here..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Record Payment"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
