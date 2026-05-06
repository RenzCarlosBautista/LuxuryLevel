import StagingApprovalDashboard from '@/components/admin/staging-approval-dashboard';

export const metadata = {
  title: 'Staging Approval | Admin Dashboard',
  description: 'Review and approve scraped products before syncing to production',
};

export default function StagingPage() {
  return <StagingApprovalDashboard />;
}
