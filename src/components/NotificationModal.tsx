"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationModalProps {
  notification: {
    _id: string;
    userId: string;
    type: string;
    case?: string;
    title: string;
    message: string;
    data?: {
      redirectUrl?: string;
      entityId?: string;
      entityType?: string;
    };
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
  };
  onClose: () => void;
}

export default function NotificationModal({ notification, onClose }: NotificationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Notification Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{notification.title}</h3>
            <p className="text-gray-600 text-sm mb-3">{notification.message}</p>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-medium text-gray-500">Type:</span>
                <p className="text-gray-700">{notification.type}</p>
              </div>
              {notification.case && (
                <div>
                  <span className="font-medium text-gray-500">Case:</span>
                  <p className="text-gray-700">{notification.case}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-500">Status:</span>
                <p className={`${notification.isRead ? 'text-green-600' : 'text-blue-600'}`}>
                  {notification.isRead ? 'Read' : 'Unread'}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Created:</span>
                <p className="text-gray-700">{new Date(notification.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            {notification.data && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <span className="font-medium text-gray-500 text-xs">Additional Info:</span>
                <div className="mt-1 space-y-1">
                  {notification.data.entityType && (
                    <p className="text-xs text-gray-600">Entity: {notification.data.entityType}</p>
                  )}
                  {notification.data.entityId && (
                    <p className="text-xs text-gray-600">ID: {notification.data.entityId}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <Button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}