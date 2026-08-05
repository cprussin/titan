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

const pageStyles = vstack({ alignItems: "stretch", gap: 6 });
