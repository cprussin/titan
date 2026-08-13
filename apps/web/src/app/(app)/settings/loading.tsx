import { SettingsContent } from "../../../components/SettingsContent";

/**
 * Loading state for settings. Renders the same tree as the page — the fixed row
 * titles with skeletons standing in for each row's dynamic description and its
 * control — so the loading placeholder cannot drift from the loaded view.
 */
const SettingsLoading = () => <SettingsContent load={{ isLoading: true }} />;

export default SettingsLoading;
