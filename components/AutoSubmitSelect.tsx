"use client";

export function AutoSubmitSelect({
  name,
  defaultValue,
  placeholder,
  options,
  className,
}: {
  name: string;
  defaultValue?: string;
  placeholder: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={className}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
