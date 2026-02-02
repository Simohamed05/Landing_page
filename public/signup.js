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

  let busy = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;

    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim().toLowerCase();
    const password = String(fd.get("password") || "");
    const password2 = String(fd.get("password2") || "");

    if (password.length < 6) {
      setMsg("Password must be at least 6 characters.", "error");
      busy = false;
      return;
    }
    if (password !== password2) {
      setMsg("Passwords do not match.", "error");
      busy = false;
      return;
    }

    setMsg("Creating account...", "");
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      // si l'API renvoie HTML/texte (rare), on évite crash
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch { data = { message: text }; }

      if (res.status === 409) {
        setMsg("Email already used.", "error");
        return;
      }

      if (!res.ok || !data.ok) {
        setMsg(data.message || "Signup failed", "error");
        return;
      }

      setMsg("Account created! Redirecting...", "success");
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
