// src/components/Modal.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { ClipLoader } from "react-spinners";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs">
      <div
        ref={modalRef}
        className="bg-gray-50 rounded-lg border border-gray-200 shadow-xl w-full max-w-md mx-4 overflow-scroll text-gray-800"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-md font-medium text-gray-500">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} className="text-red-800 bg-red-50 border" />
          </button>
        </div>

        <div className="p-4 text-blue-800">{children}</div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-blue-600 rounded-md text-blue-600"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              {
                onConfirm ? onConfirm() : "";
              }
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            {loading ? (
              <ClipLoader color="white" size={16} className="mr-2" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
