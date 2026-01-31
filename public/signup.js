document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const msg = document.getElementById("signupMsg");
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (!form) {
    console.error("❌ signupForm not found");
    return;
  }

  const setMsg = (text, ok = false) => {
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = ok ? "#0a7a2f" : "#b00020";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const password2 = String(fd.get("password2") || "");

    if (password.length < 6) {
      setMsg("Password must be at least 6 characters.");
      return;
    }

    if (password !== password2) {
      setMsg("Passwords do not match.");
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

      const data = await res.json();
      console.log("SIGNUP RESPONSE:", data);

      if (!res.ok || !data.ok) {
        setMsg(data.message || "Signup failed");
        return;
      }

      setMsg("Account created! Redirecting...", true);

      // ✅ Redirection vers Streamlit
      setTimeout(() => {
        window.location.replace("https://ventespro.streamlit.app");
      }, 400);

      // (Alternative si tu préfères envoyer vers login)
      // window.location.replace("/login.html");

    } catch (err) {
      console.error(err);
      setMsg("Network error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
      }
    }
  });
});
