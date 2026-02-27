import {
  getUser,
  saveUser,
  useLimit,
  isPremium,
  getActiveWorkers,
} from "../utils.js";
import config from "../config.js";

export default async (sock, from, sender, msg) => {
  const user = await getUser(sender);
  if (!user)
    return sock.sendMessage(from, {
      text: "Ketik .daftar dulu bro, jangan nyelonong.",
    });

  const now = Date.now();
  const activeWorkers = getActiveWorkers(user);
  // ================= HP CHECK =================
  if (user.hp < 50)
    return sock.sendMessage(from, {
      text: "HP minimal 50 untuk hack bank.",
    });

  // ================= COOLDOWN =================
  const cooldown = config.cooldown.rob;
  if (now - (user.lasthack || 0) < cooldown)
    return sock.sendMessage(from, {
      text: "Hack masih cooldown.",
    });

  if (user.level < 3)
    return sock.sendMessage(from, {
      text: "Minimal level 3 untuk bisa hack bank.",
    });
  // ================= TARGET =================
  const target =
    msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]?.split(
      "@",
    )[0];

  if (!target)
    return sock.sendMessage(from, { text: "Tag target yang valid." });

  if (target === sender)
    return sock.sendMessage(from, { text: "Hack diri sendiri? Ngaco." });

  const victim = await getUser(target);
  if (!victim)
    return sock.sendMessage(from, { text: "Target belum terdaftar." });

  if (victim.level < 2)
    return sock.sendMessage(from, {
      text: "Dia Masih Pemulai coy jangan dihack.",
    });

  if (victim.bank <= 0)
    return sock.sendMessage(from, { text: "Bank target kosong." });

  // ================= WORKERS CHECK =================
  if (activeWorkers >= user.workers) {
    return sock.sendMessage(from, {
      text: "Semua worker sedang bekerja.",
    });
  }

  // ================= START HACK =================
  const duration = (Math.floor(Math.random() * 11) + 10) * 60 * 1000;
  user.hackend = now + duration;
  user.lasthack = now;

  let chance = 0.4;

  if (isPremium(user)) chance += 0.1;

  // firewall reduce chance
  if (Date.now() < (victim.firewalluntil || 0)) {
    chance -= 0.3;
  }

  if (chance < 0) chance = 0;
  if (chance > 0.9) chance = 0.9;

  const success = Math.random() < chance;

  if (success) {
    const percent = Math.random() * 0.15 + 0.1;
    let steal = Math.floor(victim.bank * percent);

    if (steal > 5000) steal = 5000;

    victim.bank -= steal;
    user.pendinggold = (user.pendinggold || 0) + steal;

    await saveUser(target, victim);
  } else {
    user.hp = Math.max(user.hp - 40, 0);

    const fine = Math.floor(user.gold * 0.1);
    user.gold -= fine;
  }

  useLimit(user);
  await saveUser(sender, user);

  return sock.sendMessage(
    from,
    {
      text: `💻 Hack dimulai...
Durasi ${Math.floor(duration / 60000)} menit.
Ketik .claim setelah selesai.`,
    },
    { quoted: msg },
  );
};
