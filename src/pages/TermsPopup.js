import React, { useState } from "react";
import { Link } from "react-router-dom";

function TermsPopup({ onAccept, onCancel }) {
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const isEnabled = agreeAge && agreeTerms;

  return (
    <div style={styles.overlay}>
      <div style={styles.popup}>
        <h3>OUR AGE RESTRICTIONS HAVE CHANGED.</h3>
        <p>
          BY USING THIS SERVICE, YOU MUST AGREE TO OUR TERMS AND CONDITIONS. See our updated{" "}
          <Link to="/terms-of-service" style={{ color: "#007bff", textDecoration: "underline" }}>Terms of Service</Link>. <strong>By checking the box</strong> you acknowledge
          and represent that you comply with these age restrictions.
        </p>

        <div style={styles.checkbox}>
          <input
            type="checkbox"
            checked={agreeAge}
            onChange={() => setAgreeAge(!agreeAge)}
          />
          <label> I am over 18 and comply with the age restrictions.</label>
        </div>

        <div style={styles.checkbox}>
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={() => setAgreeTerms(!agreeTerms)}
          />
          <label>
            I agree to the{" "}
            <Link to="/terms-of-service" style={{ color: "#007bff", textDecoration: "underline" }}>Terms of Service</Link>,{" "}
            <Link to="/privacy-policy" style={{ color: "#007bff", textDecoration: "underline" }}>Privacy Policy</Link>, and{" "}
            <Link to="/community-guidelines" style={{ color: "#007bff", textDecoration: "underline" }}>Community Guidelines</Link>.
          </label>
        </div>

        <button
          style={isEnabled ? styles.buttonActive : styles.buttonDisabled}
          disabled={!isEnabled}
          onClick={isEnabled ? onAccept : undefined}
        >
          Confirm & Continue
        </button>
        <button
          style={{
            ...styles.buttonActive,
            backgroundColor: "#888",
            marginLeft: "10px"
          }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 1000,
  },
  popup: {
    background: "#fff",
    padding: "2rem",
    borderRadius: "16px",
    width: "500px",
    textAlign: "left",
    fontSize: "14px",
    boxShadow: "0px 0px 15px rgba(0,0,0,0.3)"
  },
  checkbox: {
    margin: "10px 0",
  },
  buttonActive: {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  buttonDisabled: {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#ccc",
    color: "#666",
    border: "none",
    borderRadius: "6px",
    cursor: "not-allowed",
  }
};

export default TermsPopup;
