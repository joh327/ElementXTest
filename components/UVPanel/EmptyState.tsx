export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center select-none">
      <div className="mb-6 relative">
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-30"
        >
          <circle cx="40" cy="40" r="18" fill="#f59e0b" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 40 + 24 * Math.cos(rad);
            const y1 = 40 + 24 * Math.sin(rad);
            const x2 = 40 + 34 * Math.cos(rad);
            const y2 = 40 + 34 * Math.sin(rad);
            return (
              <line
                key={angle}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#f59e0b"
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Explore UV Levels</h2>
      <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
        Click anywhere on the map to discover the UV index and sun safety information for that
        location.
      </p>
      <div className="mt-8 space-y-2 w-full max-w-xs">
        {[
          { color: '#22c55e', label: 'Low', range: '0–2' },
          { color: '#eab308', label: 'Moderate', range: '3–5' },
          { color: '#f97316', label: 'High', range: '6–7' },
          { color: '#ef4444', label: 'Very High', range: '8–10' },
          { color: '#a855f7', label: 'Extreme', range: '11+' },
        ].map(({ color, label, range }) => (
          <div key={label} className="flex items-center gap-3 text-sm text-gray-500">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="flex-1">{label}</span>
            <span className="text-gray-400">UV {range}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
