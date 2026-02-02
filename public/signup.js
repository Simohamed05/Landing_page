document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const msg = document.getElementById("signupMsg");
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (!form) return;

  const setMsg = (text = "", type = "") => {
    if (!msg) return;
    msg.textContent = text;
    msg.classList.remove("error", "success");
    if (type) msg.classList.add(type);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // reset message
    setMsg("");

    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const password2 = String(fd.get("password2") || "");

    if (password.length < 6) return setMsg("Password must be at least 6 characters.", "error");
    if (password !== password2) return setMsg("Passwords do not match.", "error");

    try {
      setMsg("Creating account...", "");
      if (submitBtn) submitBtn.disabled = true;

      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setMsg(data.message || "Signup failed", "error");
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      // ✅ only here success + redirect
      setMsg("Account created! Redirecting...", "success");
      window.location.replace("https://ventespro.streamlit.app");

    } catch (err) {
      setMsg("Network error", "error");
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
