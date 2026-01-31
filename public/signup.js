document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const msg = document.getElementById("signupMsg");
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (!form || !msg) {
    console.error("❌ signupForm or signupMsg not found");
    return;
  }

  let isSubmitting = false; // ✅ anti double submit

  const setMsg = (text = "", type = "") => {
    msg.textContent = text;
    msg.classList.remove("error", "success");
    if (type) msg.classList.add(type);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (isSubmitting) return; // ✅ bloque double click
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

    setMsg("Creating account...", "");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.7";
    }

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      // ✅ JSON safe parse
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      // ✅ SUCCESS uniquement si res.ok ET data.ok
      if (res.ok && data.ok) {
        setMsg("Account created! Redirecting...", "success");
        setTimeout(() => {
          window.location.replace("https://ventespro.streamlit.app");
        }, 400);
        return;
      }

      // ✅ cas email already used (409)
      if (res.status === 409) {
        setMsg("Email already used", "error");
        return;
      }

      setMsg(data.message || "Signup failed", "error");
    } catch (err) {
      console.error(err);
      setMsg("Network error", "error");
    } finally {
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
      }
    }
  });
});
