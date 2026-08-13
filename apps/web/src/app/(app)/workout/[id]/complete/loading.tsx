import { CompleteContent } from "../../../../../components/CompleteContent";

/**
 * Loading state for the workout summary. Renders the same tree as the page — the
 * stat row, the set-by-set log, and the next-session panel — driven by the
 * loading branch of its `load` prop, so skeletons settle in place once the
 * session totals and adaptations resolve without the layout drifting.
 */
const CompleteLoading = () => <CompleteContent load={{ isLoading: true }} />;

export default CompleteLoading;
