import { useState } from "react";
 
const TESTS = [
  {
    id: "test1",
    title: "Mock Test — 1",
    subtitle: "Aptitude + CS Fundamentals",
    questions: 90,
    duration: "50 min",
    parts: "Part 1: Aptitude (30 min)  ·  Part 2: CS (20 min)",
    sections: "Quant · Logical · Verbal · DI · AR · OOPs · DBMS · OS · CN · DSA",
    status: "live",
    color: "#4f46e5",
  },
  {
    id: "test2",
    title: "Mock Test — 2",
    subtitle: "Placement Preparation",
    questions: 90,
    duration: "50 min",
    parts: "Part 1: Aptitude (30 min)  ·  Part 2: CS (20 min)",
    sections: "Quant · Logical · Verbal · DI · AR · OOPs · DBMS · OS · CN · DSA",
    status: "live",
    color: "#059669",
  },
  {
  id: "test3",
  title: "Mock Test — 3",
  subtitle: "Aptitude + CS Fundamentals",
  questions: 90,
  duration: "50 min",
  parts: "Part 1: Aptitude (30 min)  ·  Part 2: CS (20 min)",
  sections: "Quant · Logical · Verbal · DI · AR · OOPs · DBMS · DSA · C++ · OS & CN",
  status: "live",
  color: "#dc2626",
},
];
 
const T = {
  bg: "#f1f5f9", card: "#ffffff",
  border: "#e2e8f0", border2: "#cbd5e1",
  accent: "#4f46e5", text: "#0f172a",
  sub: "#475569", muted: "#94a3b8",
  shadow: "0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
};
const font = "'Segoe UI','Inter',system-ui,sans-serif";
 
export default function App() {
  const [activeTest, setActiveTest] = useState(null);
 
  const loadTest = async (testId) => {
    const module = await import(`./tests/${testId}/MockTest.jsx`);
    setActiveTest({ id: testId, Component: module.default });
  };
 
  if (activeTest) {
    return (
      <div>
        <button
          onClick={() => setActiveTest(null)}
          style={{
            position: "fixed", top: "16px", left: "16px", zIndex: 999,
            background: T.card, border: `1px solid ${T.border2}`,
            color: T.sub, padding: "8px 14px", borderRadius: "8px",
            fontFamily: font, fontSize: "13px", fontWeight: "600",
            cursor: "pointer", boxShadow: T.shadow,
          }}>
          ← Back to Tests
        </button>
        <activeTest.Component />
      </div>
    );
  }
 
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: font, padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
 
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ fontSize: "11px", color: T.accent, fontWeight: "700", letterSpacing: "3px", marginBottom: "12px" }}>
            THE ENTANGLE · ELITE 100 CLUB
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: "800", color: T.text, margin: "0 0 10px" }}>
            Test Portal
          </h1>
          <p style={{ color: T.sub, fontSize: "16px", margin: 0 }}>
            Placement Preparation · Advanced Assessments
          </p>
        </div>
 
        {/* Test Cards */}
        <div style={{ display: "grid", gap: "16px" }}>
          {TESTS.map(test => (
            <div key={test.id} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: "14px", padding: "28px",
              boxShadow: T.shadow, borderLeft: `4px solid ${test.color}`,
            }}>
 
              {/* Top row — title + button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: T.text, margin: 0 }}>
                    {test.title}
                  </h2>
                  {test.status === "coming_soon" && (
                    <span style={{ background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a", borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: "700" }}>
                      Coming Soon
                    </span>
                  )}
                  {test.status === "live" && (
                    <span style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", borderRadius: "20px", padding: "2px 10px", fontSize: "11px", fontWeight: "700" }}>
                      ● Live
                    </span>
                  )}
                </div>
                {test.status === "live" ? (
                  <button onClick={() => loadTest(test.id)} style={{
                    background: test.color, color: "#fff", border: "none",
                    padding: "12px 24px", borderRadius: "9px", fontFamily: font,
                    fontSize: "14px", fontWeight: "700", cursor: "pointer", flexShrink: 0,
                  }}>
                    Start Test →
                  </button>
                ) : (
                  <button disabled style={{
                    background: T.border, color: T.muted, border: "none",
                    padding: "12px 24px", borderRadius: "9px", fontFamily: font,
                    fontSize: "14px", fontWeight: "600", cursor: "not-allowed", flexShrink: 0,
                  }}>
                    Coming Soon
                  </button>
                )}
              </div>
 
              {/* Center block — subtitle, stats, sections */}
              <div style={{ textAlign: "center", padding: "16px 0", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, marginBottom: "14px" }}>
                <div style={{ fontSize: "14px", color: T.sub, fontWeight: "600", marginBottom: "12px" }}>
                  {test.subtitle}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap", marginBottom: "12px" }}>
                  {[["📋", `${test.questions} Questions`], ["⏱", test.duration], ["📊", "Mixed Difficulty"]].map(([icon, label]) => (
                    <span key={label} style={{ fontSize: "13px", color: T.muted }}>
                      {icon} {label}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: "12px", color: T.muted }}>
                  {test.sections}
                </div>
              </div>
 
              {/* Bottom — parts info */}
              <div style={{ textAlign: "center", fontSize: "12px", color: T.muted }}>
                {test.parts}
              </div>
 
            </div>
          ))}
        </div>
 
        <div style={{ textAlign: "center", marginTop: "48px", fontSize: "12px", color: T.muted }}>
          © The Entangle · Elite 100 Club · Indore
        </div>
      </div>
    </div>
  );
}