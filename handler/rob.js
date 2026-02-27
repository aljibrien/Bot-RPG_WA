import { getUser, saveUser, useLimit, getActiveWorkers } from "../utils.js";
import { processClaim } from "./claim.js";

export default async (sock, from, sender, msg) => {
  const user = await getUser(sender);
  if (!user)
    return sock.sendMessage(from, {
      text: "Ketik .daftar dulu bro, jangan nyelonong.",
    });

  // ================= AUTO CLAIM =================
  const auto = await processClaim(user);

  if (auto) {
    await saveUser(sender, user);
    await sock.sendMessage(from, { text: auto }, { quoted: msg });
  }

  let autoText = "";

  if (auto) {
    autoText = auto + "\n\n";
  }

  const now = Date.now();

  // ================= HOSPITAL CHECK =================
  if (user.restend && user.restend > now) {
    return sock.sendMessage(from, {
      text: "Kamu sedang di hospital.",
    });
  }

  // ================= HP CHECK =================
  if (user.hp < 30) {
    return sock.sendMessage(from, {
      text: "HP minimal 30 untuk merampok.",
    });
  }

  // ================= WORKER CHECK =================
  const activeWorkers = getActiveWorkers(user);

  if (activeWorkers >= user.workers) {
    return sock.sendMessage(from, {
      text: "Semua worker sedang bekerja.",
    });
  }

  // ================= TARGET =================
  const target =
    msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]?.split(
      "@",
    )[0];

  if (!target)
    return sock.sendMessage(
      from,
      { text: "Tag target yang valid." },
      { quoted: msg },
    );

  if (target === sender)
    return sock.sendMessage(
      from,
      { text: "Rob diri sendiri? Ngaco" },
      { quoted: msg },
    );

  const victim = await getUser(target);

  if (!victim)
    return sock.sendMessage(
      from,
      { text: "Target belum terdaftar." },
      { quoted: msg },
    );

  if (victim.gold <= 0)
    return sock.sendMessage(from, { text: "Target miskin " }, { quoted: msg });

  if (Date.now() < victim.shielduntil)
    return sock.sendMessage(
      from,
      { text: "Target sedang dilindungi." },
      { quoted: msg },
    );

  // ================= START ROB =================
  user.robend = now + 2 * 60 * 1000; // 2 menit

  // Tentukan hasil sekarang
  const success = Math.random() < 0.5;

  if (success) {
    const steal = Math.floor(victim.gold * 0.2);

    victim.gold -= steal;
    victim.underrobuntil = user.robend;
    user.pendinggold = (user.pendinggold || 0) + steal;

    await saveUser(target, victim);
  } else {
    const damage = 20;
    user.hp = Math.max(user.hp - damage, 0);
  }

  useLimit(user);
  await saveUser(sender, user);

  return sock.sendMessage(
    from,
    {
      text:
        autoText +
        `🕵️ Operasi dimulai...
Target lagi dipantau...
Tunggu ${Math.floor((user.robend - now) / 60000)} menit.
Ketik .claim buat lihat hasilnya.`,
    },
    { quoted: msg },
  );
};
