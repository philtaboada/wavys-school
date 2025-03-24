import { FieldError, UseFormRegister } from "react-hook-form";

interface InputFieldProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  type?: string;
  defaultValue?: any;
  hidden?: boolean;
}

const InputField = ({
  label,
  name,
  register,
  error,
  type = "text",
  defaultValue,
  hidden,
}: InputFieldProps) => {
  if (hidden) {
    return (
      <input
        type="hidden"
        defaultValue={defaultValue}
        {...register(name)}
      />
    );
  }

  return (
    <div className="flex flex-col space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        id={name}
        defaultValue={defaultValue}
        className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm w-full focus:ring-blue-500 focus:ring-2 focus:outline-none transition duration-200"
        {...register(name)}
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
