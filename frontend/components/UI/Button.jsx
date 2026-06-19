export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
}) {
  const baseStyle = 'px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 focus:ring-indigo-500 disabled:bg-indigo-800/50 disabled:text-slate-400',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 focus:ring-slate-500 disabled:bg-slate-800/40 disabled:text-slate-500',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 focus:ring-rose-500 disabled:bg-rose-800/50 disabled:text-slate-400',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing...
        </>
      ) : children}
    </button>
  );
}
