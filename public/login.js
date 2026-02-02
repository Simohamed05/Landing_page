document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMsg");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = "Loading...";

    const email = document.getElementById("email")?.value?.trim() || "";
    const password = document.getElementById("password")?.value || "";

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (msg) msg.textContent = data.message || "Login failed";
        return;
      }

      if (data.token) localStorage.setItem("token", data.token);
      if (msg) msg.textContent = "Login success! Redirecting...";

      window.location.replace("https://ventespro.streamlit.app");
    } catch {
      if (msg) msg.textContent = "Network error";
    }
  });
});
