export default function Input({
  label,
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  required = false,
  error = '',
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-slate-300 font-medium text-sm">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        name={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`bg-slate-950/60 border ${error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:ring-indigo-500'} rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900 transition-all duration-200`}
      />
      {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
