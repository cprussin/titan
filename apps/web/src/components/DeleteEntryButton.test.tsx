import { describe, expect, it } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DeleteEntryButton } from "./DeleteEntryButton";

const router: AppRouterInstance = {
  back: () => undefined,
  forward: () => undefined,
  prefetch: () => undefined,
  push: () => undefined,
  refresh: () => undefined,
  replace: () => undefined,
};

/** A promise plus its resolver, so a test can fire the interaction inside
 *  `act` and still read what the component reported. */
const deferred = <T,>() => {
  const handle: { resolve: (value: T) => void } = { resolve: () => undefined };
  const promise = new Promise<T>((resolve) => {
    handle.resolve = resolve;
  });
  return { promise, resolve: (value: T) => handle.resolve(value) };
};

const openConfirmation = () =>
  fireEvent.click(screen.getByRole("button", { name: "Delete weigh-in" }));

const pressDelete = () =>
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));

describe(DeleteEntryButton, () => {
  it("removes the entry at its endpoint once the deletion is confirmed", async () => {
    const deleted = deferred<string>();
    render(
      <AppRouterContext.Provider value={router}>
        <DeleteEntryButton
          endpoint="/api/history/body-metrics/m1"
          itemLabel="weigh-in"
          remove={(endpoint) => {
            deleted.resolve(endpoint);
            return Promise.resolve();
          }}
        />
      </AppRouterContext.Provider>,
    );
    openConfirmation();
    await act(async () => {
      pressDelete();
      await deleted.promise;
    });
    expect(await deleted.promise).toBe("/api/history/body-metrics/m1");
  });

  it("tells the list it changed, so a client-loaded list can catch up", async () => {
    const notified = deferred<true>();
    render(
      <AppRouterContext.Provider value={router}>
        <DeleteEntryButton
          endpoint="/api/history/body-metrics/m1"
          itemLabel="weigh-in"
          onDeleted={() => {
            notified.resolve(true);
          }}
          remove={() => Promise.resolve()}
        />
      </AppRouterContext.Provider>,
    );
    openConfirmation();
    await act(async () => {
      pressDelete();
      await notified.promise;
    });
    expect(await notified.promise).toBe(true);
  });
});
