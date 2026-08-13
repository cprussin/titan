import { BlockContent } from "../../../../../../components/BlockContent";

/**
 * Loading state for a program block. Renders the same tree as the page, driven
 * by the loading branch of its `load` prop, so the block chrome holds and a
 * representative day schedule stands in until the block resolves.
 */
const BlockLoading = () => <BlockContent load={{ isLoading: true }} />;

export default BlockLoading;
