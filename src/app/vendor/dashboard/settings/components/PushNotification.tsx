"use client";

import {
  toastConfigError,
  toastConfigSuccess,
} from "@/app/config/toast.config";
import { useSubscribeToPush, useUnsubscribeFromPush } from "@/hooks/mutations";
import { useUserStore } from "@/stores/useUserStore";
import React, { useState, useEffect } from "react";
import { register } from "@/serviceWorker";
import Modal from "@/components/Modal";
import { toast } from "react-toastify";
import { useUserSubscriptions } from "@/hooks/queries";

type Props = {};

const PushNotification = (props: Props) => {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const { mutate: subscribe, isPending } = useSubscribeToPush();
  const { mutate: unsubscribe, isPending: unsubscribeIsPending } =
    useUnsubscribeFromPush();
  const { setDeviceId, deviceId } = useUserStore();
  const { data: userSubscriptions } = useUserSubscriptions();

  useEffect(() => {
    if (userSubscriptions && userSubscriptions.subscriptions.length > 0) {
      userSubscriptions.subscriptions.map((sub: any) => {
        if (sub.deviceId === deviceId) setIsSubscribed(true);
      });
    }
  }, [userSubscriptions, setDeviceId]);

  // Register service worker on component mount
  useEffect(() => {
    register();
  }, []);

  async function subscribeUserToPush() {
    try {
      // Check if service worker is supported
      if (!("serviceWorker" in navigator)) {
        toast.error(
          "Push notifications are not supported in this browser",
          toastConfigError
        );
        return;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied", toastConfigError);
        return;
      }

      // Get service worker registration
      const swUrl = `${process.env.PUBLIC_URL || ""}/service-worker.js`;
      let swRegistration;

      try {
        // Try to get existing registration first
        swRegistration = await navigator.serviceWorker.getRegistration(swUrl);

        // If no registration exists, register the service worker
        if (!swRegistration) {
          console.log("No service worker found, registering now");
          swRegistration = await navigator.serviceWorker.register(swUrl);
          console.log("Service worker registered:", swRegistration);
        }
      } catch (err) {
        console.error("Error getting/registering service worker:", err);
        toast.error("Failed to register service worker", toastConfigError);
        return;
      }

      // Subscribe to push notifications
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true, // Required for Chrome
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      // Verify subscription has required properties
      if (!subscription || !subscription.endpoint) {
        throw new Error("Failed to create valid subscription");
      }

      // Convert subscription to JSON to ensure keys are included
      const subscriptionJSON = subscription.toJSON();
      console.log("Push subscription created:", subscriptionJSON);

      // Send subscription to server
      subscribe(
        { subscription: subscriptionJSON },
        {
          onSuccess: (data) => {
            setIsSubscribed(true);
            setDeviceId(data.deviceId);
            toast.success(data.message, toastConfigSuccess);
          },
          onError: (error) => {
            console.error("Subscription error:", error);
            toast.error(
              "Subscription failed: " + (error?.message || "Unknown error"),
              toastConfigError
            );
          },
        }
      );
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      toast.error(
        `Push notification error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        toastConfigError
      );
    }
  }

  // Helper function to convert base64 to Uint8Array
  function urlBase64ToUint8Array(base64String: string) {
    if (!base64String) {
      console.error("VAPID key is empty or undefined");
      throw new Error("VAPID key is empty or undefined");
    }

    try {
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      return outputArray;
    } catch (error) {
      console.error("Error converting VAPID key:", error);
      throw new Error("Invalid VAPID key format");
    }
  }

  const handleSubscribe = (value: boolean) => {
    if (value) {
      subscribeUserToPush();
    }
  };

  const handleUnsubscribe = () => {
    if (isSubscribed) {
      unsubscribe(deviceId || "", {
        onSuccess: () => {
          setIsSubscribed(false);
          toast.success(
            "Unsubscribed from push notifications",
            toastConfigSuccess
          );
        },
        onError: (error: any) => {
          toast.error(
            "Failed to unsubscribe: " + error.message,
            toastConfigError
          );
        },
      });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-x-2">
        <span className="text-xs">Push Notifications</span>
        <div
          className={`w-8 h-4 rounded-full flex items-center cursor-pointer transition-colors duration-200 ${
            isSubscribed
              ? "bg-blue-600 justify-end"
              : "bg-gray-300 justify-start"
          }${
            isPending || unsubscribeIsPending
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
          onClick={() => {
            if (!isPending && !unsubscribeIsPending) {
              if (isSubscribed) {
                setIsModalOpen(true);
              } else {
                handleSubscribe(true);
              }
            }
          }}
        >
          <div className="w-3 h-3 bg-white rounded-full mx-0.5 transition-transform duration-200" />
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Unsubscribe from Notifications"
        onConfirm={handleUnsubscribe}
        confirmText="Unsubscribe"
        cancelText="Cancel"
      >
        <p className="text-sm text-center">Are you sure you want to unsubscribe from push notifications?</p>
        <p className="text-xs text-gray-500 mt-2 text-center">
          You will no longer receive notifications about new orders, messages,
          and other important updates.
        </p>
      </Modal>
    </div>
  );
};

export default PushNotification;
