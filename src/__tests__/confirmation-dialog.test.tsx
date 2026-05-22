/**
 * @vitest-environment jsdom
 */
import React from "react";
globalThis.React = React;

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

// ═══════════════════════════════════════════════════════════════════════════════
// ConfirmationDialog Tests
// Validates: Requirements 12.3, 12.4
// ═══════════════════════════════════════════════════════════════════════════════

// Mock the Dialog component for testability in jsdom
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogDescription: ({ children }: any) => (
    <p data-testid="dialog-description">{children}</p>
  ),
  DialogFooter: ({ children }: any) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, ...props }: any) => (
    <button
      data-testid={`button-${variant || "default"}`}
      data-variant={variant}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  ),
}));

describe("ConfirmationDialog", () => {
  let mockOnConfirm: ReturnType<typeof vi.fn>;
  let mockOnCancel: ReturnType<typeof vi.fn>;

  const defaultProps = {
    isOpen: true,
    title: "Disable Auto-Accept Orders",
    description: "You are about to disable automatic order acceptance.",
    consequences: "New orders will require manual review before being accepted.",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    mockOnConfirm = vi.fn();
    mockOnCancel = vi.fn();
    defaultProps.onConfirm = mockOnConfirm;
    defaultProps.onCancel = mockOnCancel;
  });

  /**
   * Validates: Requirement 12.3
   * THE confirmation dialog SHALL include a clear description of the action,
   * its consequences, and distinct "Confirm" and "Cancel" buttons.
   */
  it("renders title, description, and consequences when open", () => {
    render(<ConfirmationDialog {...defaultProps} />);

    expect(screen.getByTestId("dialog-title").textContent).toBe(
      "Disable Auto-Accept Orders"
    );
    expect(screen.getByTestId("dialog-description").textContent).toBe(
      "You are about to disable automatic order acceptance."
    );
    expect(
      screen.getByText("New orders will require manual review before being accepted.")
    ).toBeTruthy();
  });

  it("renders distinct Confirm and Cancel buttons", () => {
    render(<ConfirmationDialog {...defaultProps} />);

    const confirmButton = screen.getByText("Confirm");
    const cancelButton = screen.getByText("Cancel");

    expect(confirmButton).toBeTruthy();
    expect(cancelButton).toBeTruthy();

    // Confirm button should be styled as destructive
    expect(confirmButton.getAttribute("data-variant")).toBe("destructive");
    // Cancel button should be styled as outline
    expect(cancelButton.getAttribute("data-variant")).toBe("outline");
  });

  it("does not render when isOpen is false", () => {
    render(<ConfirmationDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId("dialog")).toBeNull();
  });

  /**
   * Validates: Requirement 12.4
   * IF the vendor cancels the confirmation dialog, THEN THE Vendor_Dashboard
   * SHALL revert the setting to its previous value without making an API call.
   */
  it("calls onCancel when Cancel button is clicked", () => {
    render(<ConfirmationDialog {...defaultProps} />);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm when Confirm button is clicked", () => {
    render(<ConfirmationDialog {...defaultProps} />);

    const confirmButton = screen.getByText("Confirm");
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it("displays different content based on props", () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title="Change Minimum Order"
        description="You are changing the minimum order amount."
        consequences="Existing product listings below this amount may be affected."
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId("dialog-title").textContent).toBe(
      "Change Minimum Order"
    );
    expect(screen.getByTestId("dialog-description").textContent).toBe(
      "You are changing the minimum order amount."
    );
    expect(
      screen.getByText("Existing product listings below this amount may be affected.")
    ).toBeTruthy();
  });
});
