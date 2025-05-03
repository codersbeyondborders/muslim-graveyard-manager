import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

type Activity = {
  payment: {
    id: number;
    familyId: number;
    amountReceived: string;
    paymentDate: string;
    createdAt: string;
  };
  family: {
    id: number;
    headOfFamily: string;
    houseNo: string;
  } | undefined;
};

export default function RecentActivity() {
  const { data: activities, isLoading, error } = useQuery<Activity[]>({
    queryKey: ['/api/dashboard/recent-activity'],
  });

  // Format relative time
  const getRelativeTime = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return activityDate.toLocaleDateString();
  };
  
  // Get icon and color based on activity type
  const getActivityDetails = (activity: Activity) => {
    const amountReceived = parseFloat(activity.payment.amountReceived);
    
    if (amountReceived > 0) {
      return {
        icon: "payments",
        iconColor: "text-primary",
        iconBgColor: "bg-primary-light/10",
        title: `Payment received from House #${activity.family?.houseNo}`,
        description: `${activity.family?.headOfFamily} paid ₹${amountReceived.toLocaleString('en-IN')} for annual dues`
      };
    }
    
    return {
      icon: "notifications_active",
      iconColor: "text-warning",
      iconBgColor: "bg-warning/10",
      title: "Payment record updated",
      description: `Record updated for ${activity.family?.headOfFamily}, House #${activity.family?.houseNo}`
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex justify-between flex-row items-center pb-2">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="link" size="sm" asChild>
            <Link href="/payments">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-start">
                <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-40 bg-gray-200 rounded"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-3 w-60 bg-gray-200 rounded mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading recent activities</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex justify-between flex-row items-center pb-2">
        <CardTitle>Recent Activity</CardTitle>
        <Button variant="link" size="sm" asChild>
          <Link href="/payments">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities && activities.length > 0 ? (
            activities.map((activity) => {
              const details = getActivityDetails(activity);
              return (
                <div key={activity.payment.id} className="flex items-start">
                  <div className={`w-8 h-8 rounded-full ${details.iconBgColor} flex items-center justify-center mr-3`}>
                    <span className={`material-icons ${details.iconColor} text-sm`}>{details.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800">{details.title}</p>
                      <span className="text-xs text-gray-500">
                        {getRelativeTime(activity.payment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{details.description}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-gray-500">No recent activities</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
