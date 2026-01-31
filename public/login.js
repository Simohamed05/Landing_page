document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMsg"); // un <div> pour afficher message

  if (!form) {
    console.error("❌ loginForm not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // IMPORTANT (empêche reload)

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
      console.log("LOGIN RESPONSE:", data);

      if (!res.ok || !data.ok) {
        if (msg) msg.textContent = data.message || "Login failed";
        return;
      }

      // stock token (optionnel)
      if (data.token) localStorage.setItem("token", data.token);

      if (msg) msg.textContent = "Login success! Redirecting...";

      // redirection FORCÉE
      setTimeout(() => {
        window.location.replace("https://ventespro.streamlit.app");
      }, 300);

    } catch (err) {
      console.error(err);
      if (msg) msg.textContent = "Network error";
    }
  });
});
