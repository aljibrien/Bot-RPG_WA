import { getUser, isPremium, getMaxHP } from "../utils.js";
import config from "../config.js";

function format(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  return `${h}j ${m}m ${s}d`;
}

export default async (sock, from, sender, msg) => {
  const user = await getUser(sender);
  if (!user) {
    return sock.sendMessage(from, {
      text: "Ketik .daftar dulu bro, jangan nyelonong.",
    });
  }

  const totalFish = user.kecil + user.sedang + user.besar + user.legend;
  const now = Date.now();
  const premium = isPremium(user);
  const maxHP = getMaxHP(user);
  const maxWorker = config.worker.max;

  let shieldText = "Tidak aktif";
  if (user.shielduntil && user.shielduntil > now) {
    shieldText = `AKTIF (${format(user.shielduntil - now)})`;
  }

  let firewallText = "Tidak aktif";
  if (user.firewalluntil && user.firewalluntil > now) {
    firewallText = `AKTIF (${format(user.firewalluntil - now)})`;
  }

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

🛡 Bodyguard: ${shieldText}
🔥 Firewall: ${firewallText}
💎 Premium: ${premium ? "AKTIF" : "Tidak aktif"}
⚡ Limit: ${premium ? "♾ Unlimited" : user.limit}`,
    },
    { quoted: msg },
  );
};
