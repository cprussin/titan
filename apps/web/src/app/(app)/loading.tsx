import { DashboardContent } from "../../components/DashboardContent";

/**
 * Loading state for the dashboard. Renders the exact same content tree as the
 * page — the trends band, week picker, headline, and session block — driven by
 * the loading branch of its `load` prop, so skeletons stand in at the leaves
 * while the structure holds steady and cannot drift from the loaded view.
 */
const DashboardLoading = () => <DashboardContent load={{ isLoading: true }} />;

export default DashboardLoading;
