export default function handler(req, res) {
  console.log("🚀 Ping endpoint was called!");
  res.status(200).json({ msg: "pong" });
}
