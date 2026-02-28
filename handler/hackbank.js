import {
  getUser,
  saveUser,
  useLimit,
  isPremium,
  getActiveWorkers,
} from "../utils.js";
import config from "../config.js";
import { processClaim } from "./claim.js";

export default async (sock, from, sender, msg) => {
  const user = await getUser(sender);
  if (!user)
    return sock.sendMessage(from, {
      text: "Ketik .daftar dulu bro, jangan nyelonong.",
    });

  const now = Date.now();

  // ================= AUTO CLAIM =================
  const auto = await processClaim(user, true);
  if (auto) await saveUser(sender, user);

  const activeWorkers = getActiveWorkers(user);

  // ================= LAGI REST =================
  if (user.restend && user.restend > now)
    return sock.sendMessage(from, {
      text: "Kamu sedang di hospital.",
    });

  // ================= LAGI DUNGEON =================
  if (user.dungeonend && user.dungeonend > now)
    return sock.sendMessage(from, {
      text: "Masih di dungeon.",
    });

  // ================= LAGI FISH =================
  if (user.fishingend && user.fishingend > now)
    return sock.sendMessage(from, {
      text: "Masih mancing.",
    });

  // ================= LAGI ROB =================
  if (user.robend && user.robend > now)
    return sock.sendMessage(from, {
      text: "Masih menjalankan rob.",
    });

  // ================= HP CHECK =================
  if (user.hp == 0)
    return sock.sendMessage(from, {
      text: "Lu sekarat ngapain hack, istirahat dulu sana",
    });

  if (user.gold < 100)
    return sock.sendMessage(from, {
      text: "Minimal punya 100 gold di tangan untuk hack bank.",
    });

  // ================= COOLDOWN =================
  const cooldown = config.cooldown.rob;
  if (now - (user.lasthack || 0) < cooldown)
    return sock.sendMessage(from, {
      text: "Hack masih cooldown.",
    });

  // ================= LEVEL CHECK =================
  if (user.level < 3)
    return sock.sendMessage(from, {
      text: "Minimal level 3 untuk bisa hack bank.",
    });

  // ================= WORKER CHECK =================
  if (activeWorkers >= user.workers)
    return sock.sendMessage(from, {
      text: "Semua worker sedang bekerja.",
    });

  // ================= TARGET =================
  const target =
    msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]?.split(
      "@",
    )[0];

  if (!target || target === sender)
    return sock.sendMessage(from, { text: "Tag target yang valid." });

  const victim = await getUser(target);
  if (!victim)
    return sock.sendMessage(from, { text: "Target belum terdaftar." });

  if (victim.level < 2)
    return sock.sendMessage(from, {
      text: "Dia masih pemula, jangan dihack.",
    });

  if (victim.bank <= 0)
    return sock.sendMessage(from, { text: "Bank target kosong." });

  // ================= START HACK =================
  const duration = (Math.floor(Math.random() * 11) + 10) * 60000;
  user.hackend = now + duration;
  user.lasthack = now;

  let chance = 0.4;

  if (isPremium(user)) chance += 0.1;
  if (Date.now() < (victim.firewalluntil || 0)) chance -= 0.3;

  if (chance < 0) chance = 0;
  if (chance > 0.9) chance = 0.9;

  const success = Math.random() < chance;

  if (success) {
    const percent = Math.random() * 0.15 + 0.1;
    let steal = Math.floor(victim.bank * percent);
    if (steal > 5000) steal = 5000;

    victim.bank -= steal;
    victim.underhackuntil = user.hackend;
    user.pendinggold = steal;

    await saveUser(target, victim);
  } else {
    user.hp = Math.max(user.hp - 40, 0);
    const fine = Math.floor(user.gold * 0.1);
    user.gold -= fine;
  }

  useLimit(user);
  await saveUser(sender, user);

  let text = "";

  if (auto) text += auto + "\n\n";

  text += `💻 Hack dimulai...
Durasi ${Math.floor(duration / 60000)} menit.
Ketik .claim setelah selesai.`;

  return sock.sendMessage(from, { text }, { quoted: msg });
};
