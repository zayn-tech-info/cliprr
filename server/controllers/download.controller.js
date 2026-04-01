import fs from "fs";
import path from "path";
import { downloadMedia, cleanupFile } from "../utils/yt-dlp.js";

export async function handleDownload(req, res) {
  const { url } = req.body || {};

  if (!url || typeof url !== "string" || url.trim() === "") {
    return res.status(400).json({ error: "No URL provided" });
  }

  try {
    // Validate URL
    new URL(url);
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

    const stream = fs.createReadStream(fullFilePath);
    stream.on("end", () => cleanupFile(fullFilePath));
    stream.on("error", (error) => {
      console.error("Stream error:", error);
      cleanupFile(fullFilePath);
      res.status(500).json({ error: "Failed to stream file." });
    });

    stream.pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    return res.status(500).json({
      error: "Download failed. The link may be invalid, private or unsupported.",
    });
  }
}
