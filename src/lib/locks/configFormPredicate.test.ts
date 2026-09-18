import { describe, it, expect } from "vitest";
import { isConfigFormEditable } from "./configFormPredicate";
import type { ConfigLockMode } from "@/components/modules/configuracion/ConfigLockProvider";

const NON_EDITABLE_MODES: ConfigLockMode[] = [
  "LOADING",
  "OCCUPIED",
  "SAME_USER_OTHER_TAB",
  "LOST",
  "DENIED",
  "CONNECTION_UNCERTAIN",
  "CLIENT_ID_UNAVAILABLE",
];

describe("isConfigFormEditable", () => {
  it("N. EDITABLE → true", () => {
    expect(isConfigFormEditable("EDITABLE")).toBe(true);
  });

  it.each(NON_EDITABLE_MODES)("M. %s → false", (mode) => {
    expect(isConfigFormEditable(mode)).toBe(false);
  });
});
