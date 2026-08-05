import { vstack } from "../../../styled-system/patterns";
import { requireAuth } from "../../auth/session";
import { PageHeader } from "../../components/PageHeader";
import { ReadinessForm } from "../../components/ReadinessForm";

const ReadinessPage = async () => {
  await requireAuth();
  return (
    <div className={pageStyles}>
      <PageHeader
        description="A quick check-in before today's session."
        title="Readiness"
      />
      <ReadinessForm />
    </div>
  );
};

export default ReadinessPage;

// The check-in is a short form, so it keeps a comfortable reading width and
// centers in the wider desktop shell instead of stretching across it.
const pageStyles = vstack({
  alignItems: "stretch",
  gap: 6,
  marginInline: "auto",
  maxInlineSize: "32rem",
});
