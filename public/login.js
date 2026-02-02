document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMsg");
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (!form) return;

  const setMsg = (text = "", type = "") => {
    if (!msg) return;
    msg.textContent = text;
    msg.classList.remove("error", "success");
    if (type) msg.classList.add(type);
  };

  let busy = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;

    const email = document.getElementById("email")?.value?.trim().toLowerCase() || "";
    const password = document.getElementById("password")?.value || "";

    setMsg("Loading...");
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch { data = { message: text }; }

      if (!res.ok || !data.ok) {
        setMsg(data.message || "Login failed", "error");
        return;
      }

      if (data.token) localStorage.setItem("token", data.token);

      setMsg("Login success! Redirecting...", "success");
      setTimeout(() => {
        window.location.replace("https://ventespro.streamlit.app");
      }, 300);

    } catch (err) {
      setMsg("Network error", "error");
    } finally {
      busy = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
