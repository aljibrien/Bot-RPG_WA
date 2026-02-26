import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";

import P from "pino";
import "dotenv/config";
import config from "./config.js";
import qrcode from "qrcode-terminal";
import express from "express";

import { isRegistered, getUser, saveUser, isPremium } from "./utils.js";

import register from "./handler/register.js";
import fish from "./handler/fish.js";
import rob from "./handler/rob.js";
import dungeon from "./handler/dungeon.js";
import bank from "./handler/bank.js";
import user from "./handler/user.js";
import leaderboard from "./handler/leaderboard.js";
import shop from "./handler/shop.js";
import give from "./handler/give.js";
import sell from "./handler/sell.js";
import claim from "./handler/claim.js";
import rest from "./handler/rest.js";
import addprem from "./handler/addprem.js";

// =======================
// EXPRESS SERVER
// =======================

const app = express();
app.get("/", (req, res) => res.send("Bot RPG is running."));
app.listen(process.env.PORT || 3000, () => {
  console.log("Web server aktif.");
});

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// =======================
// START BOT
// =======================

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state,
    version,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    retryRequestDelayMs: 250,
    defaultQueryTimeoutMs: 0,
  });

  sock.ev.on("creds.update", saveCreds);

  // =======================
  // CONNECTION INFO
  // =======================

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("QR muncul");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("Bot tersambung.");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      console.log("Connection closed:", statusCode);

      if (statusCode !== DisconnectReason.loggedOut) {
        setTimeout(() => startBot(), 5000);
      } else {
        console.log("Session logout.");
      }
    }
  });

  // =======================
  // MESSAGE HANDLER
  // =======================

  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0];
      if (!msg?.message) return;
      if (msg.key.fromMe) return;
      if (msg.message?.protocolMessage) return;

      const from = msg.key.remoteJid;
      const isGroup = from.endsWith("@g.us");

      // FULL JID TANPA UBAH FORMAT
      const sender = isGroup ? msg.key.participant : msg.key.remoteJid;

      console.log("IS GROUP:", isGroup);
      console.log("REMOTE:", msg.key.remoteJid);
      console.log("PARTICIPANT:", msg.key.participant);
      console.log("SENDER FINAL:", sender);

      if (!sender) return;

      const text =
        msg.message.conversation || msg.message.extendedTextMessage?.text || "";

      if (!text.startsWith(config.prefix)) return;

      const args = text.trim().split(/\s+/);
      const command = args[0].slice(1).toLowerCase();

      // ======================
      // REGISTER CHECK
      // ======================

      if (command !== "daftar" && !(await isRegistered(sender))) {
        return sock.sendMessage(from, {
          text: "Kamu belum terdaftar. Ketik .daftar dulu.",
        });
      }

      const userData = await getUser(sender);
      const now = Date.now();
      const oneDay = 86400000;

      // RESET LIMIT
      if (userData && now - userData.lastreset > oneDay) {
        if (!isPremium(userData)) userData.limit = 20;
        userData.lastreset = now;
        await saveUser(sender, userData);
      }

      // LIMIT CHECK
      if (
        userData &&
        !["daftar", "help", "lb", "shop", "me", "claim"].includes(command)
      ) {
        if (!isPremium(userData) && userData.limit <= 0) {
          return sock.sendMessage(from, {
            text: "Limit harian habis. Upgrade premium.",
          });
        }
      }

      // ANTI SPAM
      if (userData) {
        if (now - userData.lastcommand < 1000) {
          userData.spamcount++;
          if (userData.spamcount >= 5) {
            return sock.sendMessage(from, {
              text: "Spam terdeteksi. Pelan-pelan.",
            });
          }
        } else {
          userData.spamcount = 0;
        }

        userData.lastcommand = now;
        await saveUser(sender, userData);
      }

      // ======================
      // COMMAND SWITCH
      // ======================

      switch (command) {
        case "p":
        case "ping":
          return sock.sendMessage(from, { text: "Bot aktif" }, { quoted: msg });

        case "daftar":
          return register(sock, from, sender, msg);

        case "fish":
        case "mancing":
          return fish(sock, from, sender, msg);

        case "dungeon":
          return dungeon(sock, from, sender);

        case "rob":
          return rob(sock, from, sender, msg);

        case "deposit":
          return bank(sock, from, sender, msg, args, "deposit");

        case "withdraw":
          return bank(sock, from, sender, msg, args, "withdraw");

        case "me":
          return user(sock, from, sender, msg);

        case "lb":
          return leaderboard(sock, from);

        case "shop":
          return shop(sock, from, sender, msg, args);

        case "give":
          return give(sock, from, sender, msg, args);

        case "sell":
          return sell(sock, from, sender, msg, args);

        case "claim":
          return claim(sock, from, sender, msg);

        case "rest":
        case "hospital":
          return rest(sock, from, sender, msg);

        case "addprem":
          return addprem(sock, from, sender, msg, args);

        case "setname":
          const newName = args.slice(1).join(" ");
          if (!newName)
            return sock.sendMessage(from, { text: "Masukkan nama" });

          const setname = await getUser(sender);
          setname.name = newName;
          await saveUser(sender, setname);

          return sock.sendMessage(from, { text: "Nama berhasil diubah." });

        case "menu":
          return sock.sendMessage(from, {
            text: `List Command:
⚡︎ .daftar
──── ୨୧ Minigames ୨୧ ────
╰┈➤ .fish
╰┈➤ .dungeon
╰┈➤ .claim
╰┈➤ .rob @tag
╰┈➤ .rest
──── ୨୧ BANK ୨୧ ────
╰┈➤ .deposit 100
╰┈➤ .withdraw 100
╰┈➤ .sell kecil 10
╰┈➤ .sell all
╰┈➤ .shop
──── ୨୧ User ୨୧ ────
╰┈➤ .me
╰┈➤ .give @tag
╰┈➤ .lb`,
          });

        case "Help":
          return sock.sendMessage(from, {
            text: `List Command:
Cara menggunakan nya itu ketik diawali titik (.) dan hilangkan kurungan []
lalu perintahnya dibawah ini:

.daftar [Nama] -> untuk daftarkan akunnya
──── ୨୧ Minigames ୨୧ ────
.fish -> untuk memancing
.dungeon -> untuk dapat gold + exp
.claim -> ambil hadiah/kegiatan apapun
.rob @tag -> Mencuri gold orang lain
.rest -> untuk memulihkan darah
──── ୨୧ BANK ୨୧ ────
.deposit [berapa] -> menyimpan uang ke bank 100 misalnya
.withdraw [berapa] -> tarik uang ke bank 100 misalnya
.sell [tipe] [berapa] -> jual ikan kecil 10 misalnya 
.sell all -> jual semua tipe ikan
.shop -> membuka list shop
──── ୨୧ User ୨୧ ────
.me -> lihat status kamu
.setname [namaBaru] -> mengganti nama kamu
.give @tag -> kirim gold ke seseorang
.lb -> melihat peringkat terkaya`,
          });

        default:
          return;
      }
    } catch (err) {
      console.error("Handler Error:", err);
    }
  });
}

startBot();
