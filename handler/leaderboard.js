import { db } from "../utils.js";

export default async (sock, from) => {
  const users = Object.entries(db);

  if (users.length === 0)
    return sock.sendMessage(from, { text: "Belum ada player." });

  const sorted = users
    .map(([id, data]) => ({
      id,
      total: data.gold + data.bank,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  let text = "🏆 Leaderboard Top 10:\n\n";

  sorted.forEach((u, i) => {
    text += `${i + 1}. ${u.id.split("@")[0]} - ${u.total} gold\n`;
  });

  return sock.sendMessage(from, { text });
};
