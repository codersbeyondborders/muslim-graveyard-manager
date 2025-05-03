import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

function MetricCard({ title, value, icon, iconColor, iconBgColor, trend }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
          </div>
          <div className={`w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center`}>
            <span className={`material-icons ${iconColor}`}>{icon}</span>
          </div>
        </div>
        {trend && (
          <div className="mt-4">
            <span className={`text-xs ${trend.isPositive ? 'text-success' : 'text-error'} flex items-center`}>
              <span className="material-icons text-sm mr-1">
                {trend.isPositive ? 'arrow_upward' : 'arrow_downward'}
              </span>
              {trend.value}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MetricsCards() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse flex justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  <div className="h-6 w-16 bg-gray-300 rounded"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading dashboard metrics</div>;
  }

  // Format numbers for display
  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <MetricCard
        title="Total Families"
        value={stats?.totalFamilies || 0}
        icon="people"
        iconColor="text-primary"
        iconBgColor="bg-primary-light/10"
        trend={{ value: "3.2% from last month", isPositive: true }}
      />
      <MetricCard
        title="Total Collections"
        value={formatCurrency(stats?.totalCollections || 0)}
        icon="account_balance_wallet"
        iconColor="text-success"
        iconBgColor="bg-success/10"
        trend={{ value: "8.4% from last month", isPositive: true }}
      />
      <MetricCard
        title="Outstanding Amount"
        value={formatCurrency(stats?.outstandingAmount || 0)}
        icon="payment"
        iconColor="text-warning"
        iconBgColor="bg-warning/10"
        trend={{ value: "2.1% from last month", isPositive: false }}
      />
      <MetricCard
        title="Pending Payments"
        value={stats?.pendingPayments || 0}
        icon="warning"
        iconColor="text-error"
        iconBgColor="bg-error/10"
        trend={{ value: "5.3% from last month", isPositive: false }}
      />
    </div>
  );
}
