const API_BASE = "https://api.talekeeper.org";

function setStatus(message, kind = "") {
  const statusEl = document.getElementById("status");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `status${kind ? ` ${kind}` : ""}`;
}

function readTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get("token");
  if (queryToken) return queryToken.trim();

  const hash = String(window.location.hash || "").replace(/^#/, "");
  if (!hash) return "";
  if (hash.toLowerCase().startsWith("token=")) return decodeURIComponent(hash.slice(6)).trim();
  return decodeURIComponent(hash).trim();
}

async function confirmPasswordReset(token, password, passwordConfirm) {
  const response = await fetch(`${API_BASE}/api/collections/users/confirm-password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      password,
      passwordConfirm,
    }),
  });

  if (response.ok) return;

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const msg = String(payload?.message || `Reset failed (${response.status})`);
  throw new Error(msg);
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const token = String(form.token.value || "").trim();
  const password = String(form.password.value || "");
  const passwordConfirm = String(form.passwordConfirm.value || "");

  if (!token) {
    setStatus("Missing reset token.", "error");
    return;
  }
  if (!password) {
    setStatus("Enter a new password.", "error");
    return;
  }
  if (password !== passwordConfirm) {
    setStatus("Passwords do not match.", "error");
    return;
  }

  setStatus("Setting new password...", "");
  try {
    await confirmPasswordReset(token, password, passwordConfirm);
    form.password.value = "";
    form.passwordConfirm.value = "";
    setStatus("Password updated. You can now log in from list.html.", "ok");
  } catch (error) {
    setStatus(`Reset failed: ${error.message}`, "error");
  }
}

function init() {
  const form = document.getElementById("reset-form");
  if (form) form.addEventListener("submit", handleSubmit);

  const tokenField = document.getElementById("token");
  if (tokenField) tokenField.value = readTokenFromUrl();
}

document.addEventListener("DOMContentLoaded", init);

