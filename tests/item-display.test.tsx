import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ItemDisplay, ItemTooltip } from "../components/ItemDisplay";
import { itemById } from "../lib/catalog";
import type { HeldItem } from "../lib/types";

describe("held-item display", () => {
  it("shows the local thumbnail and falls back without a broken image", () => {
    const leftovers = itemById.get("leftovers")!;
    const { container, rerender } = render(<ItemDisplay item={leftovers} locale="en" />);
    expect(screen.getByText("Leftovers")).toBeInTheDocument();
    const image = container.querySelector<HTMLImageElement>("img.item-icon")!;
    expect(image).toHaveAttribute("src", "/items/leftovers.png");
    fireEvent.error(image);
    expect(container.querySelector("img.item-icon")).not.toBeInTheDocument();
    expect(container.querySelector(".item-icon-fallback")).toHaveTextContent("?");

    const missing: HeldItem = { ...leftovers, id: "missing", name: "Missing item", nameZh: "Missing item", imageUrl: null };
    rerender(<ItemDisplay item={missing} locale="en" />);
    expect(screen.getByText("Missing item")).toBeInTheDocument();
    expect(container.querySelector(".item-icon-fallback")).toBeInTheDocument();
  });

  it("uses the same icon and localized name in the trigger and tooltip", async () => {
    const user = userEvent.setup();
    const garchompite = itemById.get("garchompite")!;
    render(<ItemTooltip item={garchompite} locale="zh-Hant" />);
    const trigger = screen.getByRole("button", { name: "烈咬陸鯊進化石" });
    expect(trigger.querySelector("img")).toHaveAttribute("src", "/items/garchompite.png");
    await user.click(trigger);
    const tooltip = await screen.findByRole("tooltip");
    expect(within(tooltip).getByText("烈咬陸鯊進化石")).toBeInTheDocument();
    expect(tooltip.querySelector("img")).toHaveAttribute("src", "/items/garchompite.png");
  });
});
