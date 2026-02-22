import { getUser, db, saveDB } from "../utils.js";
import config from "../config.js";

export default async (sock, from, msg, sender) => {
  const user = getUser(sender);
  if (!user) return sock.sendMessage(from, { text: "Ketik .daftar dulu." });

  const now = Date.now();
  if (now - user.lastRob < config.cooldown.rob)
    return sock.sendMessage(from, { text: "Cooldown rob 30 menit." });

  const target =
    msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

  if (!target || !db[target])
    return sock.sendMessage(from, { text: "Tag target yang valid." });

  if (target === sender)
    return sock.sendMessage(from, { text: "Rob diri sendiri? Serius?" });

  const victim = db[target];

  if (victim.gold <= 0)
    return sock.sendMessage(from, { text: "Target miskin." });

  if (Date.now() < victim.shieldUntil)
    return sock.sendMessage(from, { text: "Target sedang dilindungi." });

  const success = Math.random() < 0.5;

  if (success) {
    const steal = Math.floor(victim.gold * (Math.random() * 0.3 + 0.1));
    victim.gold -= steal;
    user.gold += steal;

    sock.sendMessage(from, {
      text: `@${sender.split("@")[0]} berhasil curi ${steal} gold.`,
      mentions: [sender],
    });
  } else {
    const penalty = 20;
    user.gold = Math.max(user.gold - penalty, 0);

    sock.sendMessage(from, {
      text: `Gagal rob. Denda ${penalty} gold.`,
    });
  }

  user.lastRob = now;
  saveDB();
};
