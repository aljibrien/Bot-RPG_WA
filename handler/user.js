import { getUser, isPremium, getMaxHP } from "../utils.js";
import config from "../config.js";

export default async (sock, from, sender, msg) => {
  const user = await getUser(sender);
  if (!user) {
    return sock.sendMessage(from, { text: "Ketik .daftar dulu." });
  }

  const totalFish = user.kecil + user.sedang + user.besar + user.legend;

  const shieldActive = Date.now() < user.shielduntil;
  const premium = isPremium(user);
  const maxHP = getMaxHP(user);
  const maxWorker = config.worker.max;

  return sock.sendMessage(
    from,
    {
      text: `📊 Status Kamu

Level: ${user.level}
Exp: ${user.exp}
HP: ${user.hp} / ${maxHP}

👷Worker: ${user.workers} / ${maxWorker}

💰 Gold: ${user.gold}
🏦 Bank: ${user.bank}

🎣 Ikan:
- Kecil: ${user.kecil}
- Sedang: ${user.sedang}
- Besar: ${user.besar}
- Legend: ${user.legend}
Total: ${totalFish}

🛡 Shield: ${shieldActive ? "AKTIF" : "Tidak aktif"}
💎 Premium: ${premium ? "AKTIF" : "Tidak aktif"}
⚡ Limit: ${premium ? "♾ Unlimited" : user.limit}`,
    },
    { quoted: msg },
  );
};
