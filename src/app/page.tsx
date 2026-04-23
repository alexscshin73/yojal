export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4">

      {/* 마스코트 + 로고 */}
      <div className="flex flex-col items-center gap-4 mb-10">
        <div className="text-8xl select-none">🦜</div>
        <div className="flex items-center gap-1">
          <span className="text-5xl font-black" style={{ color: "#00897B" }}>Y</span>
          <span className="text-5xl font-black" style={{ color: "#E53935" }}>o</span>
          <span className="text-5xl font-black" style={{ color: "#FDD835" }}>j</span>
          <span className="text-5xl font-black" style={{ color: "#1E88E5" }}>a</span>
          <span className="text-5xl font-black" style={{ color: "#00897B" }}>l</span>
        </div>
        <p className="text-gray-500 text-base tracking-wide">
          Habla más, aprende mejor.
        </p>
      </div>

      {/* 언어 선택 */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <p className="text-center text-gray-700 font-semibold text-lg mb-2">
          어떤 언어를 배울까요?
        </p>

        <button
          className="w-full py-4 rounded-2xl text-white text-xl font-bold shadow-md active:scale-95 transition-transform"
          style={{ backgroundColor: "#E53935" }}
        >
          🇪🇸 스페인어
        </button>

        <button
          className="w-full py-4 rounded-2xl text-white text-xl font-bold shadow-md active:scale-95 transition-transform"
          style={{ backgroundColor: "#1E88E5" }}
        >
          🇺🇸 영어
        </button>
      </div>

      {/* 슬로건 */}
      <p className="mt-12 text-xs text-gray-400">
        조잘조잘 · Yojal · 요할
      </p>
    </main>
  );
}
