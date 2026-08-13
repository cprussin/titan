import { HistoryContent } from "../../../components/HistoryContent";

/**
 * Loading state for the history list. Renders the same two-column ledger tree as
 * the page, driven by the loading branch of its `load` prop, so placeholder rows
 * stand in until the real sessions resolve without the layout drifting.
 */
const HistoryLoading = () => <HistoryContent load={{ isLoading: true }} />;

export default HistoryLoading;
