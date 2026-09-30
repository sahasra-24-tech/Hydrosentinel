import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const featureCards = [
  {
    title: "District intelligence",
    text: "Monitor rain, river risk, and localized flood alerts before the next storm intensifies.",
  },
  {
    title: "AI advisory engine",
    text: "Surface practical guidance for farmers, local responders, and public safety teams in real time.",
  },
  {
    title: "Prevention-first alerts",
    text: "Track early risks with a single view built to support quicker decisions and safer field planning.",
  },
];

const metricCards = [
  { label: "Live monitoring", value: "24/7" },
  { label: "Risk coverage", value: "18 districts" },
  { label: "Preparedness", value: "AI-guided" },
  { label: "Response speed", value: "Instant" },
];

function Reveal({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    setTilt({
      rotateX: (0.5 - y) * 10,
      rotateY: (x - 0.5) * 12,
    });
  };

  const handleMouseLeave = () => setTilt({ rotateX: 0, rotateY: 0 });

  return (
    <main className="hero-page">
      <div className="hero-shell">
        <motion.section
          className="hero-card hero-tilt-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1200px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
          }}
        >
          <div className="hero-copy">
            <p className="eyebrow">HydroSentinel</p>
            <h1>HydroSentinel — Know Your Weather Risk Before It&apos;s Too Late</h1>
            <p>
              Track district-level weather conditions, flood risk, AI advisories, and alerts from one clean dashboard built for farmers and the public.
            </p>
            <div className="hero-actions">
              <Link to="/dashboard" className="btn btn-primary">Get Started</Link>
              <Link to="/state-overview" className="btn btn-secondary">State Overview</Link>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="radar-core">
              <span className="radar-ring ring-one" />
              <span className="radar-ring ring-two" />
              <span className="radar-ring ring-three" />
              <span className="radar-dot" />
            </div>
            <div className="hero-stat-panel">
              <div className="hero-stat-header">Live Risk Index</div>
              <div className="hero-stat-value">72%</div>
              <div className="hero-stat-bars">
                <span style={{ width: "62%" }} />
                <span style={{ width: "84%" }} />
                <span style={{ width: "74%" }} />
              </div>
            </div>
          </div>
        </motion.section>

        <Reveal>
          <section className="feature-grid">
            {featureCards.map((feature) => (
              <article key={feature.title} className="glass-panel">
                <div className="panel-icon" aria-hidden="true">◌</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </section>
        </Reveal>

        <Reveal delay={0.1}>
          <section className="metrics-grid">
            {metricCards.map((metric) => (
              <article key={metric.label} className="glass-panel metric-panel">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </section>
        </Reveal>
      </div>
    </main>
  );
}
