import pkg from "@whiskeysockets/baileys";
const { default: makeWASocket, useMultiFileAuthState } = pkg;

import P from "pino";

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, qr }) => {
    if (qr) console.log("Scan QR");
    if (connection === "open") {
      console.log("Connected");

      // kirim ke nomor sendiri
      sock.sendMessage("6289626880034@s.whatsapp.net", {
        text: "test",
      });
    }
  });
}

start();
