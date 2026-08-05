import { css } from "../../../styled-system/css";
import { requireAuth } from "../../auth/session";
import { ReadinessForm } from "../../components/ReadinessForm";

const ReadinessPage = async () => {
  await requireAuth();
  return (
    <div>
      <h1 className={titleStyles}>Readiness</h1>
      <ReadinessForm />
    </div>
  );
};

export default ReadinessPage;

const titleStyles = css({
  fontSize: "3xl",
  fontWeight: "bold",
  marginBlockEnd: 4,
});
