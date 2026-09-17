export function GradientCanvas() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background" aria-hidden>
      <div
        className="blob-a absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full opacity-40"
        style={{
          background: "radial-gradient(circle, hsl(var(--hue1) 80% 55%), transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="blob-b absolute top-[20%] right-[-15%] w-[55vw] h-[55vw] rounded-full opacity-35"
        style={{
          background: "radial-gradient(circle, hsl(var(--hue2) 75% 50%), transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="blob-c absolute bottom-[-15%] left-[20%] w-[50vw] h-[50vw] rounded-full opacity-25"
        style={{
          background: "radial-gradient(circle, hsl(var(--hue1) 70% 45%), transparent 70%)",
          filter: "blur(80px)",
        }}
      />
    </div>
  );
}
