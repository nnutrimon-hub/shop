"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { registerUser, type RegisterInput } from "@/services/api/auth";

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterInput) => registerUser(data),
    onSuccess: () => {
      toast.success("Бүртгэл амжилттай");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
