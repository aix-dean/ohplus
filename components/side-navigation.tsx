import React from 'react';
import { LayoutDashboard, FileText, CreditCard, Calculator, DollarSign, Receipt, FileCheck, Settings, TrendingUp, LineChart, PieChart } from 'lucide-react';

const getSectionConfig = (section: string) => {
  switch (section) {
    case 'finance':
      return {
        title: 'Finance',
        notificationSection: {
          title: 'Finance',
          bgColor: 'bg-department-finance-green',
          textColor: 'text-white',
          items: [
            { label: 'Pending Invoices', count: 8 },
            { label: 'Overdue Payments', count: 3 },
            { label: 'Budget Alerts', count: 2 }
          ]
        },
        toGoSection: {
          title: 'To Go',
          items: [
            { label: 'Dashboard', href: '/finance/dashboard', icon: LayoutDashboard },
            { label: 'Reports', href: '/finance/reports', icon: FileText }
          ]
        },
        toDoSection: {
          title: 'To Do',
          items: [
            { label: 'Transactions', href: '/finance/transactions', icon: CreditCard },
            { label: 'Budget Planning', href: '/finance/budget', icon: Calculator },
            { label: 'Payments', href: '/finance/payments', icon: DollarSign },
            { label: 'Invoicing', href: '/finance/invoices', icon: Receipt },
            { label: 'Tax Management', href: '/finance/tax', icon: FileCheck },
            { label: 'Settings', href: '/finance/settings', icon: Settings }
          ]
        },
        intelligenceSection: {
          title: 'Intelligence',
          items: [
            { label: 'Financial Analytics', href: '/finance/analytics', icon: TrendingUp },
            { label: 'Cash Flow Forecast', href: '/finance/forecast', icon: LineChart },
            { label: 'Cost Analysis', href: '/finance/cost-analysis', icon: PieChart }
          ]
        }
      }
    // ... other cases here
    default:
      return null;
  }
};

const SideNavigation: React.FC = () => {
  // ... existing code here
  return (
    <div>
      {/* ... existing JSX here */}
    </div>
  );
};

export default SideNavigation;
