import pkg from "@whiskeysockets/baileys";
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = pkg;

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

// ==========================
// EXPRESS KEEP ALIVE
// ==========================
const app = express();

app.get("/", (req, res) => {
  res.send("Bot RPG is running.");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Web server aktif.");
});

// ==========================
// GLOBAL ERROR HANDLER
// ==========================
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// ==========================
// START BOT
// ==========================
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state,
    browser: ["Windows", "Chrome", "120.0.0"],
    markOnlineOnConnect: true,
    syncFullHistory: false,
  });

  sock.ev.on("creds.update", saveCreds);

  // ==========================
  // MESSAGE HANDLER
  // ==========================
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0];
      if (!msg?.message) return;
      if (msg.key.fromMe) return;

      const from = msg.key.remoteJid;
      const isGroup = from.endsWith("@g.us");
      const sender = isGroup ? msg.key.participant : from;

      const text =
        msg.message.conversation || msg.message.extendedTextMessage?.text;

      if (!text?.startsWith(config.prefix)) return;

      const args = text.trim().split(/\s+/);
      const command = args[0].slice(1).toLowerCase();

      if (command !== "daftar" && !(await isRegistered(sender))) {
        return sock.sendMessage(from, {
          text: "Kamu belum terdaftar. Ketik .daftar dulu.",
        });
      }

      const userData = await getUser(sender);
      const now = Date.now();
      const oneDay = 86400000;

      if (userData && now - userData.lastreset > oneDay) {
        if (!isPremium(userData)) userData.limit = 30;
        userData.lastreset = now;
        await saveUser(sender, userData);
      }

      if (
        userData &&
        !["daftar", "help", "lb", "shop", "me"].includes(command)
      ) {
        if (!isPremium(userData) && userData.limit <= 0) {
          return sock.sendMessage(from, {
            text: "Limit harian habis. Upgrade premium.",
          });
        }
      }

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

      switch (command) {
        case "p":
        case "ping":
          return sock.sendMessage(from, {
            text: "Bot aktif",
          });

        case "daftar":
          return register(sock, from, sender);

        case "fish":
        case "mancing":
          return fish(sock, from, sender);

        case "dungeon":
          return dungeon(sock, from, sender);

        case "rob":
          return rob(sock, from, msg, sender);

        case "deposit":
          return bank(sock, from, sender, args, "deposit");

        case "withdraw":
          return bank(sock, from, sender, args, "withdraw");

        case "me":
          return user(sock, from, sender);

        case "lb":
          return leaderboard(sock, from);

        case "shop":
          return shop(sock, from, sender, args);

        case "give":
          return give(sock, from, msg, sender, args);

        case "sell":
          return sell(sock, from, sender, args);

        case "help":
          return sock.sendMessage(from, {
            text: `List Command:
⚡︎ .daftar
──── ୨୧ Minigames ୨୧ ────
╰┈➤ .fish
╰┈➤ .dungeon
╰┈➤ .rob @tag
──── ୨୧ BANK ୨୧ ────
╰┈➤ .deposit 100
╰┈➤ .withdraw 100
╰┈➤ .sell kecil 10 (jual ikan sebagian)
╰┈➤ .sell all (jual ikan semuanya)
╰┈➤ .shop
──── ୨୧ User ୨୧ ────
╰┈➤ .me
╰┈➤ .give @tag
╰┈➤ .lb (leaderboard)`,
          });

        default:
          return;
      }
    } catch (err) {
      console.error("Handler Error:", err);
    }
  });

  // ==========================
  // CONNECTION HANDLER (FIXED)
  // ==========================
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("QR muncul");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;

      console.log("Status code:", statusCode);

      if (statusCode !== DisconnectReason.loggedOut) {
        setTimeout(() => startBot(), 5000);
      } else {
        console.log("Session logout.");
      }
    }

    if (connection === "open") {
      console.log("Bot tersambung.");
    }
  });
}

startBot();
