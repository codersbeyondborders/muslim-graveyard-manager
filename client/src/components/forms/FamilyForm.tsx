import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertFamilySchema } from "@shared/schema";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FamilyFormProps {
  familyId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

// Extend the schema with validation
const formSchema = insertFamilySchema.extend({
  mobileNo: z.string().min(10, "Mobile number must be at least 10 digits"),
  headOfFamily: z.string().min(2, "Name must be at least 2 characters"),
  houseNo: z.string().min(1, "House number is required"),
  address: z.string().min(3, "Address must be at least 3 characters"),
});

export default function FamilyForm({ familyId, onSuccess, onCancel }: FamilyFormProps) {
  const { toast } = useToast();
  const [isInitialPayment, setIsInitialPayment] = useState(false);
  const isEditMode = !!familyId;
  
  // Form definition
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      headOfFamily: "",
      parentage: "",
      successor1st: "",
      successor2nd: "",
      address: "",
      houseNo: "",
      mobileNo: "",
    },
  });
  
  // Create family mutation
  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/families", values);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Family has been successfully added",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add family",
        variant: "destructive",
      });
    },
  });
  
  // Update family mutation (if in edit mode)
  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest("PUT", `/api/families/${familyId}`, values);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Family has been successfully updated",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update family",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isEditMode) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };
  
  return (
    <div>
      <div className="text-xl font-semibold mb-6">
        {isEditMode ? "Edit Family" : "Add New Family"}
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="headOfFamily"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name Head of Family</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="parentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parentage</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter parentage" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="successor1st"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Successor 1st</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter first successor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="successor2nd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Successor 2nd</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter second successor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter complete address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="houseNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>House No</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter house number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="mobileNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile No</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter mobile number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {!isEditMode && (
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="initialPayment" 
                checked={isInitialPayment}
                onChange={() => setIsInitialPayment(!isInitialPayment)}
                className="rounded text-primary focus:ring-primary"
              />
              <label htmlFor="initialPayment" className="text-sm text-gray-700">
                Add initial payment details
              </label>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                isEditMode ? "Update Family" : "Save Family"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
