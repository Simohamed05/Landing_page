document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMsg");
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  if (!form) {
    console.error("❌ loginForm not found");
    return;
  }

  const setMsg = (text = "", type = "") => {
    if (!msg) return;
    msg.textContent = text;
    msg.classList.remove("error", "success");
    if (type) msg.classList.add(type);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    setMsg("");

    const email = String(document.getElementById("email")?.value || "").trim();
    const password = String(document.getElementById("password")?.value || "");

    if (!email || !password) {
      setMsg("Missing email or password", "error");
      return;
    }

    try {
      setMsg("Loading...");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.7";
      }

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      console.log("LOGIN RESPONSE:", data);

      if (!res.ok || !data.ok) {
        setMsg(data.message || "Login failed", "error");
        return;
      }

      // optionnel
      if (data.token) localStorage.setItem("token", data.token);

      setMsg("Login success! Redirecting...", "success");

      setTimeout(() => {
        setMsg("");
        window.location.replace("https://ventespro.streamlit.app");
      }, 150);

    } catch (err) {
      console.error(err);
      setMsg("Network error", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
      }
    }
  });
});
