import { redirect } from "next/navigation";
import { css } from "../../../styled-system/css";
import { isAuthenticated } from "../../auth/session";
import { LoginForm } from "../../components/LoginForm";

const LoginPage = async () => {
  if (await isAuthenticated()) {
    redirect("/");
  } else {
    return (
      <main className={mainStyles}>
        <LoginForm />
      </main>
    );
  }
};

export default LoginPage;

// The login screen has no nav, so it carries its own content column: side
// gutters on small screens (the form centers itself within).
const mainStyles = css({
  md: { paddingInline: 6 },
  paddingInline: 4,
});
