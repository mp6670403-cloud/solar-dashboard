export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-xl transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
}
