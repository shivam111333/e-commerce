import { useField } from "formik";

const DEFAULT_CLASS_NAME =
  "w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500";

function FormField({
  name,
  label,
  type = "text",
  as = "input",
  className = DEFAULT_CLASS_NAME,
  containerClassName = "mb-5",
  labelClassName = "block text-sm font-medium text-gray-700 mb-2",
  renderControl,
  children,
  ...inputProps
}) {
  const [field, meta] = useField(name);
  const id = inputProps.id || name.replaceAll(".", "-");
  const error = meta.touched && meta.error;
  const describedBy = error ? `${id}-error` : inputProps["aria-describedby"];
  const controlProps = {
    ...field,
    ...inputProps,
    id,
    ...(as === "input" ? { type } : {}),
    "aria-invalid": error ? "true" : inputProps["aria-invalid"],
    "aria-describedby": describedBy,
    className: error
      ? `${className} border-red-500 focus:ring-red-400`
      : className,
  };

  let control;
  if (renderControl) {
    control = renderControl(controlProps);
  } else if (as === "textarea") {
    control = <textarea {...controlProps}>{children}</textarea>;
  } else if (as === "select") {
    control = <select {...controlProps}>{children}</select>;
  } else {
    control = <input {...controlProps} type={type} />;
  }

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={id} className={labelClassName}>
          {label}
        </label>
      )}
      {control}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
