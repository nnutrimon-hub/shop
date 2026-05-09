"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";
import { useDebounce } from "@/hooks/use-debounce";
import { API_ENDPOINTS } from "@/services/api/endpoints";

export default function CartSync() {
  const { status } = useSession();
  const items = useCartStore((s) => s.items);
  const loadFromServer = useCartStore((s) => s.loadFromServer);

  // Only true after loadFromServer() completes — prevents debounced sync
  // from writing [] to the server before we've loaded the real cart.
  const readyToSyncRef = useRef(false);
  const isLoadingRef = useRef(false);

  // Load cart whenever the user is authenticated (covers page load + login).
  useEffect(() => {
    if (status !== "authenticated") {
      readyToSyncRef.current = false;
      return;
    }
    isLoadingRef.current = true;
    readyToSyncRef.current = false;
    loadFromServer().finally(() => {
      // Wait longer than the debounce (1500ms) so the first item-change
      // triggered by loadFromServer never races to write back to the server.
      setTimeout(() => {
        isLoadingRef.current = false;
        readyToSyncRef.current = true;
      }, 2000);
    });
  }, [status, loadFromServer]);

  // Persist cart to server whenever items change (debounced).
  const debouncedItems = useDebounce(items, 1500);
  useEffect(() => {
    if (status !== "authenticated" || !readyToSyncRef.current || isLoadingRef.current) return;
    fetch(API_ENDPOINTS.cart.base, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: debouncedItems }),
    });
  }, [debouncedItems, status]);

  return null;
}
