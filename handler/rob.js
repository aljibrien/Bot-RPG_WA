import {
  getUser,
  saveUser,
  useLimit,
  getActiveWorkers,
  getActiveJobsText,
  isPremium,
} from "../utils.js";
import { processClaim } from "./claim.js";

export default async (sock, from, sender, msg) => {
  const user = await getUser(sender);
  if (!user) {
    return sock.sendMessage(from, {
      text: "⚠️ Akun belum terdaftar.\nKetik .daftar NamaAnda",
    });
  }
  const now = Date.now();

  const cooldown = 600000; // 10 menit misalnya
  const timePassed = now - (user.lastrob || 0);

  if (timePassed < cooldown) {
    const remaining = cooldown - timePassed;
    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);

    return sock.sendMessage(from, {
      text: `Rob masih cooldown.\nSisa ${m}m ${s}s`,
    });
  }

  // ================= AUTO CLAIM =================
  const auto = await processClaim(user, true);
  if (auto) await saveUser(sender, user);

  const activeWorkers = getActiveWorkers(user);

  // ================= LAGI REST =================
  if (user.restend && user.restend > now)
    return sock.sendMessage(from, {
      text: "Kamu sedang di hospital.",
    });

  // ================= HP CHECK =================
  if (user.hp < 30)
    return sock.sendMessage(from, {
      text: "HP minimal 30 untuk merampok.",
    });

  // ================= MASIH ROB =================
  if (user.robend && user.robend > now) {
    return sock.sendMessage(from, {
      text: `Masih rob seseorang.\nSisa ${format(user.robend - now)}`,
    });
  }

  // ================= WORKER CHECK =================
  if (activeWorkers >= user.workers) {
    return sock.sendMessage(from, {
      text: getActiveJobsText(user),
    });
  }

  // ================= TARGET =================
  const target =
    msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]?.split(
      "@",
    )[0];

  if (!target || target === sender)
    return sock.sendMessage(from, {
      text: "Tag target yang valid.",
    });

  const victim = await getUser(target);
  if (!victim)
    return sock.sendMessage(from, {
      text: "Target belum terdaftar.",
    });

  if (victim.gold <= 0)
    return sock.sendMessage(from, {
      text: "Target miskin.",
    });

  if (Date.now() < (victim.shielduntil || 0))
    return sock.sendMessage(from, {
      text: "Target sedang dilindungi.",
    });

  // ================= START ROB =================
  const duration = 2 * 60 * 1000;
  user.robend = now + duration;

  let chance = 0.5;

  if (isPremium(user)) chance += 0.1; // +10%

  if (chance > 0.8) chance = 0.8; // biar gak over

  const success = Math.random() < chance;

  if (success) {
    const percent = Math.random() * 0.2 + 0.1;
    const steal = Math.floor(victim.gold * percent);

    victim.gold -= steal;
    victim.underrobuntil = user.robend;
    user.pendingrob = steal;

    await saveUser(target, victim);
  } else {
    user.hp = Math.max(user.hp - 20, 0);
  }

  useLimit(user);
  await saveUser(sender, user);

  let text = "";

  if (auto) text += auto + "\n\n";

  text += `🕵️ Operasi dimulai...
Tunggu ${Math.floor(duration / 60000)} menit.
Ketik .claim untuk lihat hasilnya.`;

  return sock.sendMessage(from, { text }, { quoted: msg });
};
