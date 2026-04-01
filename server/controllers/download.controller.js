import fs from "fs";
import path from "path";
import { lookup } from "dns/promises";
import { pipeline } from "stream/promises";
import { downloadMedia, cleanupFile } from "../utils/yt-dlp.js";

const allowedHosts = [
  "youtube.com",
  "youtu.be",
  "instagram.com",
  "tiktok.com",
  "www.tiktok.com",
  "x.com",
  "twitter.com",
  "facebook.com",
  "fb.watch",
  "pinterest.com",
  "vimeo.com",
  "dailymotion.com",
  "dai.ly",
];

const isAllowedHost = (hostname) =>
  allowedHosts.some((h) => hostname === h || hostname.endsWith(`.${h}`));

const isPrivateIp = (ip) => {
  // IPv6 loopback/link-local/unique local
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) {
    return true;
  }
  // IPv4-mapped IPv6
  if (lower.startsWith("::ffff:")) {
    return isPrivateIp(lower.replace("::ffff:", ""));
  }
  // IPv4 checks
  const parts = ip.split(".").map((p) => parseInt(p, 10));
  if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
  }
  return false;
};

export async function handleDownload(req, res) {
  const { url } = req.body || {};

  if (!url || typeof url !== "string" || url.trim() === "") {
    return res.status(400).json({ error: "No URL provided" });
  }

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({ error: "Invalid URL provided" });
    }
    const hostname = parsed.hostname.toLowerCase();
    if (!isAllowedHost(hostname)) {
      return res.status(403).json({ error: "Unsupported host." });
    }
    const lookups = await lookup(hostname, { all: true });
    if (!lookups || lookups.length === 0) {
      return res.status(400).json({ error: "Unable to resolve host." });
    }
    const blocked = lookups.some((entry) => isPrivateIp(entry.address));
    if (blocked) {
      return res.status(403).json({ error: "Host is not allowed." });
    }
  } catch (error) {
    return res.status(400).json({ error: "Invalid URL provided" });
  }

  try {
    const outputPathStem = await downloadMedia(url);
    const tmpDir = path.resolve("tmp");
    const files = fs.readdirSync(tmpDir);
    const stemBase = path.basename(outputPathStem);
    const matchedFilename = files.find((file) => file.startsWith(stemBase));

    if (!matchedFilename) {
      return res
        .status(500)
        .json({ error: "Download failed. File not found after processing." });
    }

    const fullFilePath = path.join(tmpDir, matchedFilename);
    const ext = path.extname(matchedFilename).toLowerCase();

    const contentType = (() => {
      if (ext === ".mp4") return "video/mp4";
      if (ext === ".mp3") return "audio/mpeg";
      if (ext === ".webm") return "video/webm";
      if (ext === ".m4a") return "audio/mp4";
      return "application/octet-stream";
    })();

    const stats = fs.statSync(fullFilePath);

    res.setHeader("Content-Disposition", `attachment; filename="${matchedFilename}"`);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", stats.size);

    let cleaned = false;
    const doCleanup = () => {
      if (cleaned) return;
      cleaned = true;
      cleanupFile(fullFilePath);
    };

    res.once("close", doCleanup);

    try {
      await pipeline(fs.createReadStream(fullFilePath), res);
    } catch (error) {
      console.error("Stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream file." });
      }
    } finally {
      doCleanup();
    }
  } catch (error) {
    console.error("Download error:", error);
    return res.status(500).json({
      error: "Download failed. The link may be invalid, private or unsupported.",
    });
  }
}
