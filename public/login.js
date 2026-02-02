document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMsg");
  const btn = document.getElementById("loginBtn");

  if (!form || !msg) return;

  const setMsg = (text = "", type = "") => {
    msg.textContent = text;
    msg.classList.remove("error", "success");
    if (type) msg.classList.add(type);
  };

  let isSubmitting = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;

    const email = (document.getElementById("email")?.value || "").trim().toLowerCase();
    const password = document.getElementById("password")?.value || "";

    if (!email || !password) {
      setMsg("Missing email/password", "error");
      isSubmitting = false;
      return;
    }

    try {
      setMsg("Signing in...", "");
      if (btn) btn.disabled = true;

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setMsg(data.message || "Login failed", "error");
        isSubmitting = false;
        if (btn) btn.disabled = false;
        return;
      }

      if (data.token) localStorage.setItem("token", data.token);

      setMsg("Login success! Redirecting...", "success");
      window.location.replace("https://ventespro.streamlit.app");
    } catch (err) {
      console.error(err);
      setMsg("Network error", "error");
    } finally {
      isSubmitting = false;
      if (btn) btn.disabled = false;
    }
  });
});
