// components/dashboard/StatCard.jsx
export default function StatCard({ icon: Icon, value, label, isLoading }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="w-10 h-10 rounded-lg bg-sky-50 text-emerald-700 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5" />
      </div>
      {isLoading ? (
        <div className="h-7 w-10 bg-slate-100 rounded animate-pulse mb-2" />
      ) : (
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      )}
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}