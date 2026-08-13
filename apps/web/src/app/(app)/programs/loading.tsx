import { ProgramsContent } from "../../../components/ProgramsContent";

/**
 * Loading state for the programs explorer. Renders the same tree as the page —
 * an auto-filling grid of program cards — driven by the loading branch of its
 * `load` prop, so card skeletons stand in until the real programs resolve
 * without the grid drifting.
 */
const ProgramsLoading = () => <ProgramsContent load={{ isLoading: true }} />;

export default ProgramsLoading;
