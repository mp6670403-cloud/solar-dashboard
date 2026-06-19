/**
 * UI/Select.jsx — Styled dropdown select component
 * 
 * Dark-themed select matching the Input.jsx design language.
 * 
 * Props:
 * - label: optional label text above the select
 * - id: HTML id/name attribute
 * - value: controlled value
 * - onChange: change handler
 * - options: array of { value, label } objects
 * - placeholder: optional placeholder text (renders as disabled first option)
 * - required: shows red asterisk on label
 * - error: error message string
 * - className: additional wrapper classes
 */

export default function Select({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  required = false,
  error = '',
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {/* Label with optional required asterisk */}
      {label && (
        <label htmlFor={id} className="text-slate-300 font-medium text-sm">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Styled native select — uses appearance-none for custom chevron */}
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required={required}
        className={`bg-slate-950/60 border ${
          error
            ? 'border-rose-500 focus:ring-rose-500'
            : 'border-slate-800 focus:ring-indigo-500'
        } rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-no-repeat pr-10`}
      >
        {/* Placeholder option */}
        {placeholder && (
          <option value="" disabled className="text-slate-500">
            {placeholder}
          </option>
        )}

        {/* Render option list */}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
            {opt.label}
          </option>
        ))}
      </select>

      {/* Error message */}
      {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
