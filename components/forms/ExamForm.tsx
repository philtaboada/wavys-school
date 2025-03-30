"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  examSchema,
  ExamSchema,
} from "@/lib/formValidationSchemas";
import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";

const ExamForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExamSchema>({
    resolver: zodResolver(examSchema),
  });


  const onSubmit = handleSubmit((data) => {
    console.log(data);
  });

  const router = useRouter();

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
 
    </form>
  );
};

export default ExamForm;
