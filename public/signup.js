document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const msg = document.getElementById("signupMsg");
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  if (!form) {
    console.error("❌ signupForm not found");
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

    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const password2 = String(fd.get("password2") || "");

    // reset message
    setMsg("");

    if (password.length < 6) {
      setMsg("Password must be at least 6 characters.", "error");
      return;
    }

    if (password !== password2) {
      setMsg("Passwords do not match.", "error");
      return;
    }

    try {
      setMsg("Creating account...");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.7";
      }

      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json().catch(() => ({}));
      console.log("SIGNUP RESPONSE:", data);

      if (!res.ok || !data.ok) {
        setMsg(data.message || "Signup failed", "error");
        return;
      }

      setMsg("Account created! Redirecting...", "success");

      // ✅ tiny delay to avoid message flicker
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
