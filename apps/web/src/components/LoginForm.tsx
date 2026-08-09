"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { css } from "../../styled-system/css";
import { vstack } from "../../styled-system/patterns";
import { Button, Input } from "../ui";

/** Single-password sign-in. On success the session cookie is set server-side and
 *  we navigate to the dashboard. */
export const LoginForm = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [failed, setFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFailed(false);
    fetch("/api/auth/login", {
      body: JSON.stringify({ password }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
      .then((response) => {
        if (response.ok) {
          router.replace("/");
          router.refresh();
        } else {
          setFailed(true);
          setSubmitting(false);
        }
      })
      .catch((error: unknown) => {
        setSubmitting(false);
        setFailed(true);
        // biome-ignore lint/suspicious/noConsole: surface a login failure
        console.error("Login failed", error);
      });
  };

  return (
    <form className={formStyles} onSubmit={submit}>
      <h1 className={titleStyles}>Titan</h1>
      <p className={subtitleStyles}>Sign in to your training.</p>
      <Input
        aria-label="Password"
        autoComplete="current-password"
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          setPassword(event.currentTarget.value)
        }
        placeholder="Password"
        type="password"
        value={password}
      />
      {failed && <p className={errorStyles}>Incorrect password.</p>}
      <Button loading={submitting} type="submit" variant="accent">
        Sign in
      </Button>
    </form>
  );
};

const formStyles = vstack({
  alignItems: "stretch",
  gap: 3,
  inlineSize: "100%",
  marginBlockStart: 24,
  marginInline: "auto",
  maxInlineSize: "24rem",
});

const titleStyles = css({
  fontFamily: "condensed",
  fontSize: "4xl",
  fontWeight: "bold",
  letterSpacing: "tight",
  lineHeight: "condensed",
  textTransform: "uppercase",
});

const subtitleStyles = css({ color: "muted" });

const errorStyles = css({ color: "danger", fontSize: "sm" });
