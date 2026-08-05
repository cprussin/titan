import { redirect } from "next/navigation";
import { isAuthenticated } from "../../auth/session";
import { LoginForm } from "../../components/LoginForm";

const LoginPage = async () => {
  if (await isAuthenticated()) {
    redirect("/");
  } else {
    return <LoginForm />;
  }
};

export default LoginPage;
