"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Loader2,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AccountDeletion() {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (password: string) =>
      settingsService.requestAccountDeletion(password),
    onSuccess: (data) => {
      toast.success("Account deletion scheduled.");
      setShowConfirmation(false);
      setPassword("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to request account deletion.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Password is required to confirm account deletion.");
      return;
    }

    deleteMutation.mutate(password);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-5 h-5 text-red-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Delete Account
        </h3>
      </div>

      <div className="rounded-md bg-red-50 border border-red-200 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-700">
            <p className="font-medium mb-1">This action is irreversible after the grace period.</p>
            <p>
              Once you request account deletion, your account will be scheduled
              for permanent deletion after a 30-day grace period. During this
              time, you can cancel the deletion by logging in and choosing to
              restore your account.
            </p>
          </div>
        </div>
      </div>

      {!showConfirmation ? (
        <Button
          variant="outline"
          className="text-red-600 border-red-300 hover:bg-red-50"
          onClick={() => setShowConfirmation(true)}
          aria-label="Request account deletion"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Request Account Deletion
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="deletion-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm your password
            </label>
            <input
              id="deletion-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              disabled={deleteMutation.isPending}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              variant="destructive"
              disabled={deleteMutation.isPending}
              aria-label="Confirm account deletion"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Confirm Deletion
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowConfirmation(false);
                setPassword("");
                setError(null);
              }}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
