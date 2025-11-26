"use client";

import React, { useEffect, useState } from "react";
import {
  TriangleAlert,
  ShoppingBag,
  CircleCheck,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useUserNotifications } from "@/hooks/queries";
import { INotification } from "@/types/notification.type";

type Activity = {
  _id: string;
  case: "new-order" | "payment-received" | "low-stock";
  title: string;
  message: string;
  createdAt?: string;
};
import { formatDistanceToNow } from "date-fns";

const ActivityIcon = ({ type }: { type: INotification["case"] }) => {
  switch (type) {
    case "new-order":
      return (
        <div className="p-2 bg-blue-100 rounded-full flex items-center justify-center">
          <ShoppingBag className="text-blue-500" size={24} />
        </div>
      );
    case "payment-received":
      return (
        <div className="p-2 bg-green-100 rounded-full flex items-center justify-center">
          <CircleCheck className="text-green-500" size={24} />
        </div>
      );
    case "low-stock":
      return (
        <div className="p-2 bg-yellow-100 rounded-full flex items-center justify-center">
          <TriangleAlert className="text-yellow-500" size={24} />
        </div>
      );
    default:
      return null;
  }
};

const SalesActivity = () => {
  const [activityFeed, setActivityFeed] = useState<INotification[] | null>(
    null
  );
  const socket = useSocket();
  const { data: userNotifications } = useUserNotifications(true);

  useEffect(() => {
    if (!userNotifications) return;
    setActivityFeed(
      userNotifications.filter((notification: INotification) =>
        ["low-stock", "payment-received", "new-order"].includes(
          notification.case
        )
      )
    );
  }, [userNotifications]);

  useEffect(() => {
    if (!socket) return;

    const notificationSound = new Audio(
      "/sounds/Game-show-ding-sound-effect.mp3"
    );

    const handleNewSalesActivity = (data: any) => {
      console.log("🛒 New activity received!", data);
      notificationSound.play().catch((err) => {
        console.warn("Sound failed to play:", err);
      });

      setActivityFeed((prev) => [data, ...(prev ?? [])]);
    };

    socket.on("saleActivitiy", handleNewSalesActivity);

    return () => {
      socket.off("saleActivitiy", handleNewSalesActivity);
    };
  }, [socket]);

  return (
    <div className="bg-white px-4 md:px-6 py-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center ">
        <h1 className="font-bold text-xl md:text-2xl text-gray-600">
          Sales Activity
        </h1>
        {activityFeed && activityFeed.length > 0 && (
          <button className="flex cursor-pointer text-blue-600 text-sm items-center ">
            <div>View All</div>
            <ArrowRight size={16} className="ml-1" />
          </button>
        )}
      </div>
      {activityFeed && activityFeed.length > 0 ? (
        <div className="space-y-4 mt-6">
          {activityFeed.map((activity) => (
            <div
              key={activity._id}
              className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0"
            >
              <ActivityIcon type={activity.case} />
              <div>
                <h3 className="font-medium text-sm">{activity.title}</h3>
                <p className="text-gray-500 text-xs mt-1">
                  {activity.message}
                </p>
                <p className="text-gray-400 text-xs whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity?.createdAt!), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-4 animate-fade-in">
          <p className="text-lg font-semibold text-gray-700 mb-1">
            No sales made yet
          </p>
          <p className="text-sm text-gray-500">
            Keep an eye out—we’ll notify you when things get moving!
          </p>
        </div>
      )}
    </div>
  );
};

export default SalesActivity;
