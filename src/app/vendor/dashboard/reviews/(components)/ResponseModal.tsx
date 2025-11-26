import React, { useState } from "react";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  review: {
    reviewer: { name: string };
    comment: string;
    rating: number;
  };
  onSubmit: (response: string) => void;
}

const ResponseModal = ({ isOpen, onClose, review, onSubmit }: Props) => {
  const [response, setResponse] = useState("");
  const maxChars = 500;

  const handleSubmit = () => {
    if (response.trim()) {
      onSubmit(response);
      setResponse("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-lg">
        {/* Modal Header */}
        <div className="flex flex-col gap-2 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Respond to Review</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
              aria-label="Close Modal"
            >
              <X size={24} className="text-red-500" strokeWidth={2} />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Responding to {review.reviewer.name}. {`"${review.comment}"`} with a
            rating of {review.rating} stars.
          </p>
        </div>

        <div className="p-6">
          {/* Response Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Response
            </label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value.slice(0, maxChars))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-sm"
              rows={6}
              placeholder="Write your response here..."
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {response.length}/{maxChars} characters
              </span>
            </div>
          </div>

          {/* Response Tips */}
          <div className="bg-blue-50 p-4 rounded-lg shadow-md mt-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Response Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Thank the customer for their feedback</li>
              <li>• Address specific concerns mentioned in the review</li>
              <li>• Keep the tone professional and helpful</li>
              <li>• Offer solutions or next steps if applicable</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 pt-2 text-sm">
          <button
            onClick={onClose}
            className="w-64 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-tertiary border-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!response.trim()}
            className="w-64 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Send Response
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponseModal;
