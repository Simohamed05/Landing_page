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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email")?.value?.trim() || "";
    const password = document.getElementById("password")?.value || "";

    if (!email || !password) {
      setMsg("Missing email/password", "error");
      return;
    }

    // anti double-submit
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.7";
    }
    setMsg("Loading...");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setMsg(data.message || "Login failed", "error");
        return;
      }

      if (data.token) localStorage.setItem("token", data.token);

      setMsg("Login success! Redirecting...", "success");
      window.location.assign("https://ventespro.streamlit.app");
    } catch (err) {
      setMsg("Network error", "error");
      console.error(err);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
      }
    }
  });
});
