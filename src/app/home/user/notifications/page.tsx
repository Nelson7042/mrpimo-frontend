"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs";
import { useRouter } from "next/navigation";
import { MessageSquare, Trash2, CheckCheck } from "lucide-react";
import { useNotifications, useDeleteNotification, useDeleteAllNotifications, useMarkNotificationAsRead, useBulkMarkAsRead, useBulkDeleteNotifications } from "@/hooks/useNotifications";
import { toast } from "react-toastify";
import NotificationModal from "@/components/NotificationModal";

interface Notification {
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
}

export default function NotificationsPage() {
  const router = useRouter();
  const { data: notificationsData, isLoading } = useNotifications();
  const deleteNotificationMutation = useDeleteNotification();
  const deleteAllNotificationsMutation = useDeleteAllNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();
  const bulkMarkAsReadMutation = useBulkMarkAsRead();
  const bulkDeleteMutation = useBulkDeleteNotifications();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showReadFilter, setShowReadFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
  const allNotifications = notificationsData?.notifications || [];
  const notifications = allNotifications.filter((n: any) => {
    if (showReadFilter === 'read') return n.isRead;
    if (showReadFilter === 'unread') return !n.isRead;
    return true;
  });

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/home" },
    { label: "Notifications", href: null },
  ];

  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    if (item.href) {
      router.push(item.href);
    }
  };

  const handleRemoveAll = () => {
    deleteAllNotificationsMutation.mutate(undefined, {
      onSuccess: () => toast.success('All notifications deleted'),
      onError: () => toast.error('Failed to delete notifications')
    });
  };

  const handleRemoveNotification = (id: string) => {
    deleteNotificationMutation.mutate(id, {
      onSuccess: () => toast.success('Notification deleted'),
      onError: () => toast.error('Failed to delete notification')
    });
  };

  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification._id);
    }
  };

  const handleSelectNotification = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(notifications.map((n: any) => n._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkMarkAsRead = () => {
    if (selectedIds.length === 0) return;
    bulkMarkAsReadMutation.mutate(selectedIds, {
      onSuccess: () => {
        toast.success(`${selectedIds.length} notifications marked as read`);
        setSelectedIds([]);
      },
      onError: () => toast.error('Failed to mark notifications as read')
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    bulkDeleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        toast.success(`${selectedIds.length} notifications deleted`);
        setSelectedIds([]);
      },
      onError: () => toast.error('Failed to delete notifications')
    });
  };

  const getNotificationIcon = (type: string) => {
    return (
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
        <MessageSquare className="w-6 h-6 text-blue-600" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">Loading notifications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={manualBreadcrumbs}
          onItemClick={handleBreadcrumbClick}
          className="mb-4"
        />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold break-words">Notifications</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => setShowReadFilter(showReadFilter === 'unread' ? 'all' : 'unread')}
              variant={showReadFilter === 'unread' ? 'default' : 'outline'}
              className="text-sm w-full sm:w-auto"
            >
              {showReadFilter === 'unread' ? 'Show All' : 'Unread Only'}
            </Button>
            <Button 
              onClick={handleRemoveAll}
              disabled={deleteAllNotificationsMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm w-full sm:w-auto"
            >
              {deleteAllNotificationsMutation.isPending ? 'Removing...' : 'Remove All'}
            </Button>
          </div>
        </div>
      
      <Card>
        <CardContent className="px-3 sm:px-4 py-4">

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-blue-700">{selectedIds.length} selected</span>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleBulkMarkAsRead}
                  disabled={bulkMarkAsReadMutation.isPending}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark Read
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* Select All */}
          {notifications.length > 0 && (
            <div className="flex items-center mb-4">
              <Checkbox
                checked={selectedIds.length === notifications.length}
                onCheckedChange={handleSelectAll}
                className="!w-4 !h-4 !min-w-4 !min-h-4 !max-w-4 !max-h-4"
              />
              <label className="ml-2 text-sm text-gray-600">Select all</label>
            </div>
          )}

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No notifications to display</p>
              </div>
            ) : (
              notifications.map((notification: Notification) => (
                <div 
                  key={notification._id} 
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow ${!notification.isRead ? 'bg-blue-50 border-blue-200' : ''}`}
                >
                  <div className="flex items-start space-x-3 flex-1 w-full">
                    <div className="flex-shrink-0 mt-1">
                      <Checkbox
                        checked={selectedIds.includes(notification._id)}
                        onCheckedChange={(checked) => handleSelectNotification(notification._id, checked as boolean)}
                        className="!w-4 !h-4 !min-w-4 !min-h-4 !max-w-4 !max-h-4"
                      />
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-gray-600 text-xs sm:text-sm break-words">
                        {notification.message}
                      </p>
                      <div className="sm:hidden text-xs text-gray-500 mt-2">
                        <p>{new Date(notification.createdAt).toLocaleDateString()}</p>
                        <p>{new Date(notification.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="hidden sm:block text-right text-sm text-gray-500 flex-shrink-0">
                      <p>{new Date(notification.createdAt).toLocaleDateString()}</p>
                      <p>{new Date(notification.createdAt).toLocaleTimeString()}</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button 
                        onClick={() => handleViewNotification(notification)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded text-xs sm:text-sm w-full sm:w-auto"
                      >
                        View
                      </Button>
                      <Button 
                        onClick={() => handleRemoveNotification(notification._id)}
                        disabled={deleteNotificationMutation.isPending}
                        variant="outline"
                        className="border-orange-300 text-orange-600 hover:bg-orange-50 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm w-full sm:w-auto"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
        </Card>
        
        {/* Notification Modal */}
        {selectedNotification && (
          <NotificationModal
            notification={selectedNotification}
            onClose={() => setSelectedNotification(null)}
          />
        )}
      </div>
    </div>
  );
}