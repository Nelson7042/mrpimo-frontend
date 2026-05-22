/**
 * @vitest-environment jsdom
 */
import React from "react";
globalThis.React = React;

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EscalationIndicator from "@/components/disputes/EscalationIndicator";

// ═══════════════════════════════════════════════════════════════════════════════
// EscalationIndicator Tests
// Validates: Requirements 4.1, 4.2, 4.3
// ═══════════════════════════════════════════════════════════════════════════════

describe("EscalationIndicator", () => {
  /**
   * Validates: Requirement 4.1
   * WHEN a dispute has an `escalatedAt` timestamp, THE Dispute_Detail_Page
   * SHALL display a visible escalation indicator with the escalation date.
   */
  describe("badge variant", () => {
    it("renders escalation badge with date when escalatedAt is provided", () => {
      render(
        <EscalationIndicator
          escalatedAt="2025-01-23T14:30:00.000Z"
          variant="badge"
        />
      );

      const badge = screen.getByTestId("escalation-badge");
      expect(badge).toBeTruthy();
      expect(badge.textContent).toContain("Escalated");
      expect(badge.textContent).toContain("Jan 23, 2025");
    });

    it("renders nothing when escalatedAt is null", () => {
      const { container } = render(
        <EscalationIndicator escalatedAt={null} variant="badge" />
      );

      expect(container.innerHTML).toBe("");
    });
  });

  /**
   * Validates: Requirements 4.2, 4.3
   * THE Dispute_Detail_Page SHALL display the escalation indicator in a distinct
   * visual style (warning color) and display a message informing the vendor
   * that an admin is reviewing the case.
   */
  describe("banner variant", () => {
    it("renders escalation banner with heading, date, and admin review message", () => {
      render(
        <EscalationIndicator
          escalatedAt="2025-02-10T09:15:00.000Z"
          variant="banner"
        />
      );

      const banner = screen.getByTestId("escalation-banner");
      expect(banner).toBeTruthy();
      expect(screen.getByText("Escalated to Admin Review")).toBeTruthy();
      expect(screen.getByText("Escalated on Feb 10, 2025")).toBeTruthy();
      expect(
        screen.getByText("An admin is reviewing this dispute")
      ).toBeTruthy();
    });

    it("renders nothing when escalatedAt is null", () => {
      const { container } = render(
        <EscalationIndicator escalatedAt={null} variant="banner" />
      );

      expect(container.innerHTML).toBe("");
    });

    it("uses warning-colored styling (amber classes)", () => {
      render(
        <EscalationIndicator
          escalatedAt="2025-03-01T12:00:00.000Z"
          variant="banner"
        />
      );

      const banner = screen.getByTestId("escalation-banner");
      expect(banner.className).toContain("border-amber-300");
      expect(banner.className).toContain("bg-amber-50");
    });
  });

  /**
   * Validates: Requirement 4.4
   * THE vendor disputes list page SHALL display an escalation badge on
   * disputes that have been escalated.
   */
  describe("badge variant styling", () => {
    it("uses warning-colored styling (amber classes) for badge", () => {
      render(
        <EscalationIndicator
          escalatedAt="2025-01-23T14:30:00.000Z"
          variant="badge"
        />
      );

      const badge = screen.getByTestId("escalation-badge");
      expect(badge.className).toContain("bg-amber-100");
      expect(badge.className).toContain("text-amber-800");
    });
  });
});
