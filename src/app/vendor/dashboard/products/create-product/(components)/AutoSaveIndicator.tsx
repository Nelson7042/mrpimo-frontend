"use client";

import React from "react";
import { Cloud, CloudOff, Check, Loader2, AlertCircle } from "lucide-react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved?: Date | null;
  isDirty?: boolean;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  lastSaved,
  isDirty = false,
}) => {
  const formatLastSaved = (date: Date | null | undefined): string => {
    if (!date) return "";
    
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffSeconds < 60) {
      return "just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      return new Date(date).toLocaleTimeString([], { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case "saving":
        return {
          icon: <Loader2 size={14} className="animate-spin text-[#002f7a]" />,
          text: "Saving...",
          textColor: "text-[#002f7a]",
          bgColor: "bg-blue-50",
        };
      case "saved":
        return {
          icon: <Check size={14} className="text-green-600" />,
          text: lastSaved ? `Saved ${formatLastSaved(lastSaved)}` : "Saved",
          textColor: "text-green-600",
          bgColor: "bg-green-50",
        };
      case "error":
        return {
          icon: <AlertCircle size={14} className="text-red-500" />,
          text: "Save failed",
          textColor: "text-red-500",
          bgColor: "bg-red-50",
        };
      case "idle":
      default:
        if (isDirty) {
          return {
            icon: <Cloud size={14} className="text-gray-400" />,
            text: "Unsaved changes",
            textColor: "text-gray-500",
            bgColor: "bg-gray-50",
          };
        }
        return {
          icon: <Cloud size={14} className="text-gray-400" />,
          text: lastSaved ? `Last saved ${formatLastSaved(lastSaved)}` : "",
          textColor: "text-gray-400",
          bgColor: "bg-gray-50",
        };
    }
  };

  const config = getStatusConfig();

  // Don't render if idle with no last saved time and not dirty
  if (status === "idle" && !lastSaved && !isDirty) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor} font-roboto transition-all duration-300`}
    >
      {config.icon}
      <span className={`text-xs ${config.textColor}`}>{config.text}</span>
    </div>
  );
};

export default AutoSaveIndicator;
