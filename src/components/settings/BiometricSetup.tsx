"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Fingerprint,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Plus,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

interface WebAuthnCredential {
  _id: string;
  credentialId: string;
  deviceName: string;
  createdAt: string;
  lastUsedAt?: string;
}

async function fetchCredentials(): Promise<WebAuthnCredential[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/webauthn/credentials`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch credentials");
  }
  const data = await response.json();
  return data.credentials || [];
}

async function removeCredential(credentialId: string): Promise<void> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/webauthn/credentials/${credentialId}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to remove credential");
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BiometricSetup() {
  const queryClient = useQueryClient();
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Check browser support for WebAuthn
  useEffect(() => {
    const checkSupport = async () => {
      if (
        typeof window !== "undefined" &&
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
      ) {
        try {
          const available =
            await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
        } catch {
          setIsSupported(false);
        }
      } else {
        setIsSupported(false);
      }
    };
    checkSupport();
  }, []);

  const {
    data: credentials,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<WebAuthnCredential[]>({
    queryKey: ["webauthnCredentials"],
    queryFn: fetchCredentials,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
  });

  const removeMutation = useMutation({
    mutationFn: removeCredential,
    onMutate: async (credentialId: string) => {
      setRemovingId(credentialId);
      await queryClient.cancelQueries({ queryKey: ["webauthnCredentials"] });
      const previous = queryClient.getQueryData<WebAuthnCredential[]>(["webauthnCredentials"]);
      queryClient.setQueryData<WebAuthnCredential[]>(["webauthnCredentials"], (old) =>
        old ? old.filter((c) => c.credentialId !== credentialId && c._id !== credentialId) : []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["webauthnCredentials"], context.previous);
      }
      toast.error("Failed to remove credential. Please try again.");
    },
    onSuccess: () => {
      toast.success("Biometric credential removed.");
    },
    onSettled: () => {
      setRemovingId(null);
      queryClient.invalidateQueries({ queryKey: ["webauthnCredentials"] });
    },
  });

  const handleRegister = useCallback(async () => {
    if (!deviceName.trim()) {
      toast.error("Please enter a name for this device.");
      return;
    }

    setIsRegistering(true);
    try {
      // Dynamically import to avoid SSR issues
      const { startRegistration } = await import("@simplewebauthn/browser");

      // Get registration options from server
      const optionsRes = await fetchWithAuth(`${API_BASE_URL}/webauthn/register/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceName: deviceName.trim() }),
      });

      if (!optionsRes.ok) {
        const errData = await optionsRes.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to get registration options");
      }

      const options = await optionsRes.json();

      // Start WebAuthn registration ceremony
      const registrationResponse = await startRegistration({ optionsJSON: options.options || options });

      // Verify with server
      const verifyRes = await fetchWithAuth(`${API_BASE_URL}/webauthn/register/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: registrationResponse,
          deviceName: deviceName.trim(),
        }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        throw new Error(errData.message || "Registration verification failed");
      }

      toast.success("Biometric credential registered successfully!");
      setShowNameInput(false);
      setDeviceName("");
      queryClient.invalidateQueries({ queryKey: ["webauthnCredentials"] });
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        toast.error("Registration was cancelled or timed out.");
      } else {
        toast.error(err.message || "Failed to register biometric credential.");
      }
    } finally {
      setIsRegistering(false);
    }
  }, [deviceName, queryClient]);

  const handleRemove = useCallback(
    (credentialId: string) => {
      removeMutation.mutate(credentialId);
    },
    [removeMutation]
  );

  // Browser doesn't support WebAuthn
  if (isSupported === false) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Fingerprint className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Biometric Authentication</h3>
        </div>
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <p className="text-sm text-amber-700">
              Your browser or device does not support biometric authentication (WebAuthn).
              Try using a modern browser with a device that has Touch ID, Face ID, or Windows Hello.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Still checking support
  if (isSupported === null) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Checking biometric support...</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading credentials...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">
            {(error as Error)?.message || "Failed to load credentials."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
          <RefreshCw className="w-4 h-4 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  const maxCredentials = 5;
  const canAddMore = (credentials?.length || 0) < maxCredentials;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Biometric Authentication</h3>
        </div>
        {canAddMore && !showNameInput && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNameInput(true)}
            aria-label="Register new biometric credential"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Device
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Use Touch ID, Face ID, or Windows Hello to sign in without a password.
        You can register up to {maxCredentials} devices.
      </p>

      {/* Registration form */}
      {showNameInput && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          <Label htmlFor="device-name" className="text-sm font-medium text-gray-700">
            Device Name
          </Label>
          <Input
            id="device-name"
            type="text"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="e.g., MacBook Pro, iPhone 15"
            className="bg-white"
            maxLength={50}
            aria-label="Name for this biometric device"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleRegister}
              disabled={isRegistering || !deviceName.trim()}
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Registering...
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4 mr-1" />
                  Register
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowNameInput(false);
                setDeviceName("");
              }}
              disabled={isRegistering}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Credentials list */}
      {!credentials || credentials.length === 0 ? (
        <p className="text-sm text-gray-500">No biometric credentials registered.</p>
      ) : (
        <div className="space-y-3">
          {credentials.map((credential) => (
            <div
              key={credential._id || credential.credentialId}
              data-testid={`credential-${credential.credentialId}`}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {credential.deviceName}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      Added: {formatDate(credential.createdAt)}
                    </span>
                    {credential.lastUsedAt && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          Last used: {formatDate(credential.lastUsedAt)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemove(credential.credentialId || credential._id)}
                disabled={removingId === credential.credentialId || removingId === credential._id}
                aria-label={`Remove credential ${credential.deviceName}`}
              >
                {removingId === credential.credentialId || removingId === credential._id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1" />
                )}
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {!canAddMore && (
        <p className="text-xs text-amber-600 mt-2">
          Maximum of {maxCredentials} credentials reached. Remove one to add another.
        </p>
      )}
    </div>
  );
}
