import supabase from "../supabase.js";
import { getUser } from "../utils.js";

export default async (sock, from, sender, msg) => {
  const { data } = await supabase.from("users").select("id, name, gold, bank");
  const user = await getUser(sender);
  if (!user) {
    return sock.sendMessage(from, {
      text: "Ketik .daftar dulu bro, jangan nyelonong.",
    });
  }

  if (!data || data.length === 0)
    return sock.sendMessage(from, { text: "Belum ada player." });

  const sorted = data
    .map((u) => ({
      id: u.id,
      name: u.name,
      total: u.gold + u.bank,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  let text = "🏆 Leaderboard Top 10:\n\n";

  sorted.forEach((u, i) => {
    text += `${i + 1}. ${u.name || u.id.split("@")[0]} - ${u.total} gold\n`;
  });

  sock.sendMessage(from, { text });
};
