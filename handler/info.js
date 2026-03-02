import { getUser } from "../utils.js";

export default async (sock, from, sender, msg, args) => {
  const type = args[1]?.toLowerCase();
  const user = await getUser(sender);

  if (!user)
    return sock.sendMessage(from, {
      text: "⚠️ Akun belum terdaftar.\nKetik .daftar NamaAnda",
    });

  if (!type) {
    return sock.sendMessage(
      from,
      {
        text: `╔═══ 📖 INFO MENU ═══╗

👑 Premium
⟢ .info premium

🎣 Rod
⟢ .info rod

🎮 Minigames
⟢ .info minigames

🏦 Bank
⟢ .info bank

👤 User
⟢ .info user

╚══════════▣`,
      },
      { quoted: msg },
    );
  }

  if (type === "premium") {
    const now = Date.now();

    let status = "Tidak aktif";
    let sisaText = "-";

    if (user.premium && user.premiumexpire > now) {
      const diff = user.premiumexpire - now;

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      status = "Aktif";
      sisaText = `${days}h ${hours}j ${minutes}m ${seconds}d`;
    }

    return sock.sendMessage(
      from,
      {
        text: `╔═ 👑 PREMIUM STATUS ═╗

Status : ${status}
Sisa   : ${sisaText}

Benefit
⟢ +50% Gold dungeon
⟢ +50% EXP dungeon
⟢ Fishing lebih hoki
⟢ +10% chance rob/hack
⟢ Limit tak terbatas

╚══════════▣`,
      },
      { quoted: msg },
    );
  }

  if (type === "rod") {
    return sock.sendMessage(
      from,
      {
        text: `╔════ 🎣 ROD INFO ════╗

⟢ Kayu    → +3% Lucky
⟢ Phantom → +6% Lucky
⟢ Tempest → +10% Lucky

⟢ Vortex⤵
+15% Lucky / 25% 2 ikan
⟢ Inferno⤵
+20% Lucky / 35% 2 ikan
⟢ Abbysal⤵
+25% Lucky / 50% 2 ikan

⟢ Demon⤵
+30% Lucky / 50% 2 ikan / 15% 3 ikan
⟢ Angel⤵
+30% Lucky / 60% 2 ikan / 20% 3 ikan
⟢ God⤵
+35% Lucky / 60% 2 ikan /
30% 3 ikan / 5% 4 ikan

╚══════════▣`,
      },
      { quoted: msg },
    );
  }

  if (type === "minigames") {
    return sock.sendMessage(
      from,
      {
        text: `╔═══ 🎮 MINIGAMES ═══╗

⟢ .fish → memancing
⟢ .dungeon → lawan monster
⟢ .rob @tag → rampok gold
⟢ .hackbank @tag → bobol bank
⟢ .rest → isi HP
⟢ .claim → ambil reward

╚══════════▣`,
      },
      { quoted: msg },
    );
  }

  if (type === "bank") {
    return sock.sendMessage(
      from,
      {
        text: `╔═══ 🏦 BANK ═══╗

⟢ .deposit jumlah
⟢ .withdraw jumlah
⟢ .shop → beli item
⟢ .sell → jual ikan

╚══════════▣`,
      },
      { quoted: msg },
    );
  }

  if (type === "user") {
    return sock.sendMessage(
      from,
      {
        text: `╔═══ 👤 USER ═══╗

⟢ .me → lihat status
⟢ .setname nama
⟢ .give @tag jumlah
⟢ .lb → leaderboard

╚══════════▣`,
      },
      { quoted: msg },
    );
  }

  return sock.sendMessage(
    from,
    {
      text: "Kategori tidak ditemukan.",
    },
    { quoted: msg },
  );
};
