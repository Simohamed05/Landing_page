document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const msg = document.getElementById("signupMsg");
  const btn = document.getElementById("signupBtn");

  if (!form || !msg) return;

  const setMsg = (text = "", type = "") => {
    msg.textContent = text;
    msg.classList.remove("error", "success");
    if (type) msg.classList.add(type);
  };

  let isSubmitting = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // anti double submit
    isSubmitting = true;

    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim().toLowerCase();
    const password = String(fd.get("password") || "");
    const password2 = String(fd.get("password2") || "");

    if (password.length < 6) {
      setMsg("Password must be at least 6 characters.", "error");
      isSubmitting = false;
      return;
    }
    if (password !== password2) {
      setMsg("Passwords do not match.", "error");
      isSubmitting = false;
      return;
    }

    try {
      setMsg("Creating account...", "");
      if (btn) btn.disabled = true;

      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        // 409 = email existe déjà
        setMsg(data.message || "Signup failed", "error");
        isSubmitting = false;
        if (btn) btn.disabled = false;
        return;
      }

      setMsg("Account created! Redirecting...", "success");

      // redirect vers streamlit
      window.location.replace("https://ventespro.streamlit.app");
    } catch (err) {
      console.error(err);
      setMsg("Network error", "error");
    } finally {
      // si on n'a pas redirect (en cas d'erreur)
      isSubmitting = false;
      if (btn) btn.disabled = false;
    }
  });
});
