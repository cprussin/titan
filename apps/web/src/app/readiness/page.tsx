import { css } from "../../../styled-system/css";
import { requireAuth } from "../../auth/session";
import { ReadinessForm } from "../../components/ReadinessForm";

const ReadinessPage = async () => {
  await requireAuth();
  return (
    <div className={pageStyles}>
      <h1 className={titleStyles}>Readiness</h1>
      <ReadinessForm />
    </div>
  );
};

export default ReadinessPage;

// The check-in is a short form, so it keeps a comfortable reading width and
// centers in the wider desktop shell instead of stretching across it.
const pageStyles = css({
  marginInline: "auto",
  maxInlineSize: "32rem",
});

const titleStyles = css({
  fontSize: "3xl",
  fontWeight: "bold",
  marginBlockEnd: 4,
});
