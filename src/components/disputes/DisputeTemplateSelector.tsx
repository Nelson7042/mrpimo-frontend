"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

// ─── Types ───

interface DisputeTemplateSelectorProps {
  onSelectTemplate: (content: string) => void;
  currentContent: string;
}

interface ResponseTemplate {
  id: string;
  reason: string;
  title: string;
  content: string;
}

// ─── Default Templates ───

const DEFAULT_TEMPLATES: ResponseTemplate[] = [
  {
    id: "product-defective",
    reason: "Product Defective",
    title: "Product Defective",
    content: `Thank you for bringing this to our attention. We're sorry to hear that the product you received is defective.

Could you please provide more details about the defect? Specifically:
- What is the nature of the defect?
- When did you first notice the issue?
- Do you have any photos or videos showing the problem?

Once we have this information, we'll work with you to find the best resolution, whether that's a replacement, repair, or refund.`,
  },
  {
    id: "wrong-item-received",
    reason: "Wrong Item Received",
    title: "Wrong Item Received",
    content: `We sincerely apologize for sending you the wrong item. We understand how frustrating this must be.

We'd like to arrange for the incorrect item to be returned at no cost to you, and we'll ship the correct item as soon as possible. Here's what we'll do:
- Send you a prepaid return label for the wrong item
- Ship the correct item with expedited delivery
- Provide tracking information once the replacement is dispatched

Please confirm your current shipping address and we'll get this resolved right away.`,
  },
  {
    id: "missing-items",
    reason: "Missing Items",
    title: "Missing Items",
    content: `We're sorry to hear that items are missing from your order. We take this matter seriously and will investigate immediately.

We're checking with our shipping partner to determine what happened during transit. In the meantime, could you please confirm:
- Which specific items are missing from your order?
- Was the package sealed when it arrived, or did it appear tampered with?

We'll provide an update within 24-48 hours and ensure you receive all items you ordered.`,
  },
  {
    id: "damaged-package",
    reason: "Damaged Package",
    title: "Damaged Package",
    content: `We're very sorry that your package arrived damaged. We understand how disappointing this is.

To help us process your claim and get this resolved quickly, could you please provide:
- Photos of the damaged packaging (exterior)
- Photos of any damage to the product inside
- A brief description of the extent of the damage

Once we review the photos, we'll arrange for a replacement or refund based on your preference. We'll also file a claim with the shipping carrier to prevent this from happening in the future.`,
  },
  {
    id: "late-delivery",
    reason: "Late Delivery",
    title: "Late Delivery",
    content: `We apologize for the delay in delivering your order. We understand that timely delivery is important to you.

We've looked into the status of your shipment and here's what we know:
- Your order tracking number is available in your order details
- We're in contact with the shipping carrier to expedite delivery

If your order has not arrived within the next 2-3 business days, please let us know and we'll explore additional options including reshipping or a refund. We appreciate your patience.`,
  },
  {
    id: "not-as-described",
    reason: "Not as Described",
    title: "Not as Described",
    content: `Thank you for reaching out. We're sorry that the product doesn't match what was described in the listing.

We take product accuracy seriously. Could you please let us know:
- What specific differences did you notice between the listing and the actual product?
- Do you have photos comparing the product to what was advertised?

Based on your feedback, we'd like to offer the following resolution options:
- Full refund with return of the item
- Partial refund if you'd like to keep the item
- Exchange for the correct product if available

Please let us know which option works best for you.`,
  },
];

// ─── Component ───

export default function DisputeTemplateSelector({
  onSelectTemplate,
  currentContent,
}: DisputeTemplateSelectorProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<ResponseTemplate | null>(null);
  const [selectedValue, setSelectedValue] = useState<string>("");

  const handleTemplateSelect = (templateId: string) => {
    const template = DEFAULT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    setSelectedValue(templateId);

    if (currentContent.trim()) {
      // Content exists — show confirmation dialog
      setPendingTemplate(template);
      setShowConfirmDialog(true);
    } else {
      // No existing content — apply immediately
      onSelectTemplate(template.content);
    }
  };

  const handleConfirmReplace = () => {
    if (pendingTemplate) {
      onSelectTemplate(pendingTemplate.content);
    }
    setShowConfirmDialog(false);
    setPendingTemplate(null);
  };

  const handleCancelReplace = () => {
    setShowConfirmDialog(false);
    setPendingTemplate(null);
    setSelectedValue("");
  };

  return (
    <div className="flex items-center gap-2">
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={selectedValue} onValueChange={handleTemplateSelect}>
        <SelectTrigger className="w-full sm:w-[260px]">
          <SelectValue placeholder="Select a response template..." />
        </SelectTrigger>
        <SelectContent>
          {DEFAULT_TEMPLATES.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace existing text?</DialogTitle>
            <DialogDescription>
              The response area already contains text. Selecting this template
              will replace your current content. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelReplace}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReplace}>Replace</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { DEFAULT_TEMPLATES };
export type { DisputeTemplateSelectorProps, ResponseTemplate };
