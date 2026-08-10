import { redirect } from "next/navigation";
import { css } from "../../../styled-system/css";
import { getSession } from "../../auth/session";
import { SignInPanel } from "../../components/SignInPanel";

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) => {
  if ((await getSession()) === undefined) {
    const { error } = await searchParams;
    return (
      <main className={mainStyles}>
        <SignInPanel error={error} />
      </main>
    );
  } else {
    redirect("/");
  }
};

export default LoginPage;

// The login screen has no nav, so it carries its own content column: side
// gutters on small screens (the form centers itself within).
const mainStyles = css({
  md: { paddingInline: 6 },
  paddingInline: 4,
});
