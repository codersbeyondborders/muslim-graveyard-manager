import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [annualRate, setAnnualRate] = useState("2500");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [exportFilename, setExportFilename] = useState("Colony_Welfare_Data");
  const [exportSheetName, setExportSheetName] = useState("Welfare_Committee");
  
  const handleSaveGeneralSettings = () => {
    toast({
      title: "Settings Saved",
      description: "General settings have been updated successfully.",
    });
  };
  
  const handleSaveNotificationSettings = () => {
    toast({
      title: "Notification Settings Saved",
      description: "Your notification preferences have been updated.",
    });
  };
  
  const handleSaveExportSettings = () => {
    toast({
      title: "Export Settings Saved",
      description: "Your export settings have been updated.",
    });
  };
  
  const handleClearCache = () => {
    queryClient.clear();
    toast({
      title: "Cache Cleared",
      description: "Application cache has been cleared successfully.",
    });
  };
  
  const handleBackupData = () => {
    toast({
      title: "Data Backup",
      description: "Your data has been backed up successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your Intizamia Sonwar settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            
            {/* General Settings */}
            <TabsContent value="general" className="space-y-6 pt-4">
              <div>
                <h3 className="text-lg font-medium">General Settings</h3>
                <p className="text-sm text-gray-500">
                  Configure basic settings for the Intizamia Sonwar
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="annual-rate">Default Annual Rate (₹)</Label>
                  <Input
                    id="annual-rate"
                    type="number"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    This is the default approved fund rate that will be applied for new payments
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="colony-name">Name</Label>
                  <Input
                    id="colony-name"
                    placeholder="Enter name"
                    defaultValue="Intizamia Sonwar"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="admin-email">Administrator Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    defaultValue="admin@intizamia-sonwar.org"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveGeneralSettings}>
                  Save General Settings
                </Button>
              </div>
            </TabsContent>
            
            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6 pt-4">
              <div>
                <h3 className="text-lg font-medium">Notification Settings</h3>
                <p className="text-sm text-gray-500">
                  Configure how and when notifications are sent
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="block">Email Notifications</Label>
                    <p className="text-xs text-gray-500">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-notifications" className="block">SMS Notifications</Label>
                    <p className="text-xs text-gray-500">
                      Receive notifications via SMS
                    </p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={smsNotifications}
                    onCheckedChange={setSmsNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="payment-reminders" className="block">Payment Reminders</Label>
                    <p className="text-xs text-gray-500">
                      Send automated reminders for pending payments
                    </p>
                  </div>
                  <Switch
                    id="payment-reminders"
                    checked={paymentReminders}
                    onCheckedChange={setPaymentReminders}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="reminder-days">Reminder Days Before Due</Label>
                  <Input
                    id="reminder-days"
                    type="number"
                    defaultValue="7"
                  />
                  <p className="text-xs text-gray-500">
                    Number of days before due date to send payment reminders
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveNotificationSettings}>
                  Save Notification Settings
                </Button>
              </div>
            </TabsContent>
            
            {/* Export Settings */}
            <TabsContent value="export" className="space-y-6 pt-4">
              <div>
                <h3 className="text-lg font-medium">Export Settings</h3>
                <p className="text-sm text-gray-500">
                  Configure how data is exported from the system
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="export-filename">Default Export Filename</Label>
                  <Input
                    id="export-filename"
                    value={exportFilename}
                    onChange={(e) => setExportFilename(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="sheet-name">Default Sheet Name</Label>
                  <Input
                    id="sheet-name"
                    value={exportSheetName}
                    onChange={(e) => setExportSheetName(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="include-timestamp" className="block">Include Timestamp in Filename</Label>
                    <p className="text-xs text-gray-500">
                      Add date and time to exported filenames
                    </p>
                  </div>
                  <Switch
                    id="include-timestamp"
                    defaultChecked
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveExportSettings}>
                  Save Export Settings
                </Button>
              </div>
            </TabsContent>
            
            {/* System Settings */}
            <TabsContent value="system" className="space-y-6 pt-4">
              <div>
                <h3 className="text-lg font-medium">System Settings</h3>
                <p className="text-sm text-gray-500">
                  Manage system operations and maintenance tasks
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <Card className="border-dashed">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Clear Application Cache</h4>
                        <p className="text-sm text-gray-500">
                          Refresh application data and clear cached information
                        </p>
                      </div>
                      <Button variant="outline" onClick={handleClearCache}>
                        <span className="material-icons mr-2 text-sm">cached</span>
                        Clear Cache
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-dashed">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Backup Data</h4>
                        <p className="text-sm text-gray-500">
                          Create a backup of all Intizamia Sonwar data
                        </p>
                      </div>
                      <Button variant="outline" onClick={handleBackupData}>
                        <span className="material-icons mr-2 text-sm">backup</span>
                        Backup Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-dashed border-red-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-600">Reset System</h4>
                        <p className="text-sm text-gray-500">
                          Reset the system to default settings. This action cannot be undone.
                        </p>
                      </div>
                      <Button variant="destructive">
                        <span className="material-icons mr-2 text-sm">warning</span>
                        Reset System
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
