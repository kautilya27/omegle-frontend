import React, { useState, useEffect } from "react";

function getRandomInRange(prev) {
  // Generate a random delta between -50 and 50, excluding 0
  let delta = Math.floor(Math.random() * 101) - 50;
  if (delta === 0) delta = 1;
  let next = prev + delta;
  // Clamp the value between 8000 and 12000
  if (next < 8000) next = 8000;
  if (next > 12000) next = 12000;
  return next;
}

function Header() {
  const [onlineNow, setOnlineNow] = useState(
    Math.floor(Math.random() * (12000 - 8000 + 1)) + 8000
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineNow(prev => getRandomInRange(prev));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#fff",
        padding: "10px 0",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        borderBottom: "1px solid #f0f0f0",
        flexWrap: "wrap",
      }}
    >
      {/* Logo and Online Text */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginLeft: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <img
            src="https://ext.same-assets.com/2180202029/3907936530.png"
            alt="Omegle Online Logo"
            style={{ height: 42 }}
          />
          <span
            style={{
              fontWeight: 600,
              fontSize: 10,
              color: "#d2874f",
              letterSpacing: 1,
              position: "relative",
              top: 13,
            }}
          >
            Online
          </span>
        </div>

        {/* Talk to strangers! */}
        <span
          style={{
            fontSize: 20,
            color: "#464b5a",
            fontWeight: 700,
            transform: "rotate(-5deg)",
            display: "inline-block",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            marginLeft: 30,
            marginTop: 6,
          }}
        >
          Talk to strangers!
        </span>
      </div>

      {/* Online Now */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginRight: 20,
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: 26,
            color: "#68a8f5",
            marginRight: 5,
          }}
        >
          {onlineNow.toLocaleString()}
        </span>
        <span
          style={{
            color: "#68a8f5",
            fontWeight: 500,
            fontSize: 16,
          }}
        >
          online now
        </span>
      </div>
    </header>
  );
}

export default Header;
