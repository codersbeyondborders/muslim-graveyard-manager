import { useState } from "react";
import MetricsCards from "@/components/dashboard/MetricsCards";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import PaymentStatusTable from "@/components/dashboard/PaymentStatusTable";

export default function Dashboard() {
  return (
    <div>
      {/* Summary Metrics */}
      <MetricsCards />
      
      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
      
      {/* Payment Status Table */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <PaymentStatusTable />
      </div>
    </div>
  );
}
