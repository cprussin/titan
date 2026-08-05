import { HeartbeatIcon } from "@phosphor-icons/react/dist/ssr/Heartbeat";
import { vstack } from "../../../styled-system/patterns";
import { requireAuth } from "../../auth/session";
import { ReadinessForm } from "../../components/ReadinessForm";
import { TopBar } from "../../components/TopBar";

const ReadinessPage = async () => {
  await requireAuth();
  return (
    <div className={pageStyles}>
      <TopBar
        breadcrumbs={[{ href: "/", label: "Today" }]}
        description="A quick check-in before today's session."
        icon={<HeartbeatIcon size={18} />}
        title="Readiness"
      />
      <ReadinessForm />
    </div>
  );
};

export default ReadinessPage;

const pageStyles = vstack({ alignItems: "stretch", gap: 6 });
