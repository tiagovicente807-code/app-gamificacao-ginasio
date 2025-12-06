"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { handleOAuthCallback } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await handleOAuthCallback();
        router.push("/");
        router.refresh();
      } catch (error) {
        console.error("Erro no callback OAuth:", error);
        router.push("/?error=auth_callback_failed");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="text-white text-xl font-medium">Autenticando com Google...</p>
        <p className="text-purple-200 text-sm mt-2">Aguarde enquanto configuramos sua conta</p>
      </div>
    </div>
  );
}
