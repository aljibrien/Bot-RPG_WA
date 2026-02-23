import { getUser } from "../utils.js";

export default async (sock, from, sender) => {
  const user = await getUser(sender);
  if (!user) return sock.sendMessage(from, { text: "Ketik .daftar dulu." });

  const totalFish = user.kecil + user.sedang + user.besar + user.legend;

  const shieldActive = Date.now() < user.shielduntil;

  return sock.sendMessage(from, {
    text: `📊 Status Kamu

Level: ${user.level}
Exp: ${user.exp}
HP: ${user.hp}

💰 Gold: ${user.gold}
🏦 Bank: ${user.bank}

🎣 Ikan:
- Kecil: ${user.kecil}
- Sedang: ${user.sedang}
- Besar: ${user.besar}
- Legend: ${user.legend}
Total: ${totalFish}

🛡 Shield: ${shieldActive ? "AKTIF" : "Tidak aktif"}
⚡ Limit: ${user.limit}`,
  });
};
