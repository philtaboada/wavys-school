import { createClient } from "@/utils/supabase/client";
import { useMutation } from "@tanstack/react-query";

export const useUpdateStudent = () => {
  const supabase = createClient();

  return useMutation(async (updatedStudent: { id: string;[key: string]: any }) => {
    const { id, ...updates } = updatedStudent;

    const { error } = await supabase.from("Student").update(updates).eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  });
};