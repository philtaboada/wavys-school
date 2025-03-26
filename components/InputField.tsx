import { RegisterOptions, UseFormRegister } from "react-hook-form";
import { ReactNode } from "react";

interface InputFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string | number;
  register: UseFormRegister<any>;
  registerOptions?: RegisterOptions;
  error?: any;
  hidden?: boolean;
  className?: string;
  icon?: ReactNode;
}

const InputField = ({
  label,
  name,
  placeholder,
  type = "text",
  defaultValue,
  register,
  registerOptions,
  error,
  hidden = false,
  className = "",
  icon
}: InputFieldProps) => {
  if (hidden) {
    return (
      <input type="hidden" {...register(name, registerOptions)} defaultValue={defaultValue} />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-medium text-gray-700 flex items-center gap-2">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        {...register(name, registerOptions)}
        className={`ring-[1.5px] ring-gray-300 p-3 rounded-lg text-sm w-full focus:ring-indigo-500 focus:ring-2 focus:outline-none transition duration-200 ${className}`}
      />
      {error?.message && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {error.message.toString()}
        </p>
      )}
    </div>
  );
};

export default InputField;
