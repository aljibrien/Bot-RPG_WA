import { getUser } from "../utils.js";

export default async (sock, from, sender) => {
  const user = getUser(sender);
  if (!user) return sock.sendMessage(from, { text: "Ketik .daftar dulu." });

  const fish = user.fish || {
    kecil: 0,
    sedang: 0,
    besar: 0,
    legend: 0,
  };

  const totalFish = fish.kecil + fish.sedang + fish.besar + fish.legend;

  const shieldActive = Date.now() < user.shieldUntil;

  return sock.sendMessage(from, {
    text: `📊 Status Kamu

Level: ${user.level}
Exp: ${user.exp}
HP: ${user.hp}

💰 Gold: ${user.gold}
🏦 Bank: ${user.bank}

🎣 Ikan:
- Kecil: ${fish.kecil}
- Sedang: ${fish.sedang}
- Besar: ${fish.besar}
- Legend: ${fish.legend}
Total: ${totalFish}

🛡 Shield: ${shieldActive ? "AKTIF" : "Tidak aktif"}
⚡ Limit: ${user.limit}`,
  });
};
