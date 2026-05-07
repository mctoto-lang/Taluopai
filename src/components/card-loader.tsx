'use client';

export function CardLoader({ className }: { className?: string }) {
  return (
    <>
      <style>{`
        .magic-loader {
          max-width: fit-content;
          font-size: 50px;
          font-family: 'Georgia', serif;
          position: relative;
          font-style: italic;
          font-weight: 600;
          color: #000000;
        }
        .magic-loader span {
          animation: magic-cut 2s infinite;
          transition: 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .magic-loader:hover {
          color: #222222;
        }
        .magic-loader::after {
          position: absolute;
          content: "";
          width: 100%;
          height: 6px;
          border-radius: 4px;
          background-color: rgba(168, 130, 255, 0.57);
          top: 0px;
          filter: blur(10px);
          animation: magic-scan 2s infinite;
          left: 0;
          z-index: 0;
          transition: 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .magic-loader::before {
          position: absolute;
          content: "";
          width: 100%;
          height: 5px;
          border-radius: 4px;
          background-color: #a882ff;
          top: 0px;
          animation: magic-scan 2s infinite;
          left: 0;
          z-index: 1;
          filter: opacity(0.9);
          transition: 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes magic-scan {
          0% { top: 0px; }
          25% { top: 54px; }
          50% { top: 0px; }
          75% { top: 54px; }
        }
        @keyframes magic-cut {
          0% { clip-path: inset(0 0 0 0); }
          25% { clip-path: inset(100% 0 0 0); }
          50% { clip-path: inset(0 0 100% 0); }
          75% { clip-path: inset(0 0 0 0); }
        }
      `}</style>
      <div className={`flex items-center justify-center ${className || ''}`}>
        <div className="magic-loader">
          <span>Magic</span>
        </div>
      </div>
    </>
  );
}
