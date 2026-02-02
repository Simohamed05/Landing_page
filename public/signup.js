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

    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim().toLowerCase();
    const password = String(fd.get("password") || "");
    const password2 = String(fd.get("password2") || "");

    if (!email || password.length < 6) {
      setMsg("Invalid email or password too short (min 6).", "error");
      return;
    }
    if (password !== password2) {
      setMsg("Passwords do not match.", "error");
      return;
    }

    // anti double-submit (IMPORTANT pour éviter "email already used" à la 1ère fois)
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.7";
    }
    setMsg("Creating account...");

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        // 409 = email déjà utilisé
        if (res.status === 409) {
          setMsg("Email already used.", "error");
        } else {
          setMsg(data.message || "Signup failed", "error");
        }
        return;
      }

      setMsg("Account created! Redirecting...", "success");
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
