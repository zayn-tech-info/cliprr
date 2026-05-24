import fs from "fs";
import path from "path";
import { lookup } from "dns/promises";
import { pipeline } from "stream/promises";
import { v4 as uuidv4 } from "uuid";
import { downloadMediaWithOptions, getMediaInfo, cleanupFile } from "../utils/yt-dlp.js";

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

const activeDownloads = new Map();
const TMP_DIR = path.resolve("tmp");
const TMP_FILE_PREFIX = "cliprr-";
const STALE_TMP_MAX_AGE_MS = 30 * 60 * 1000;

const cleanupStemFiles = (tmpDir, stemBase) => {
  try {
    const files = fs.readdirSync(tmpDir).filter((file) => file.startsWith(stemBase));
    files.forEach((file) => cleanupFile(path.join(tmpDir, file)));
  } catch {
    // ignore cleanup errors
  }
};

const cleanupStaleTmpFiles = (tmpDir, maxAgeMs = STALE_TMP_MAX_AGE_MS) => {
  try {
    const now = Date.now();
    const files = fs.readdirSync(tmpDir).filter((file) => file.startsWith(TMP_FILE_PREFIX));
    files.forEach((file) => {
      const fullPath = path.join(tmpDir, file);
      try {
        const stat = fs.statSync(fullPath);
        const ageMs = now - stat.mtimeMs;
        if (ageMs >= maxAgeMs) {
          cleanupFile(fullPath);
        }
      } catch {
        // ignore per-file stat/delete errors
      }
    });
  } catch {
    // ignore directory errors
  }
};

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return null;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  const rounded = idx === 0 ? Math.round(value) : value.toFixed(value >= 10 ? 1 : 2);
  return `${rounded} ${units[idx]}`;
};

const normalizeFormats = (formats = []) => {
  return formats
    .filter((fmt) => fmt && fmt.format_id)
    .filter((fmt) => fmt.vcodec && fmt.vcodec !== "none")
    .map((fmt) => {
      const estimatedBytes = fmt.filesize || fmt.filesize_approx || null;
      const height = Number.isFinite(fmt.height) ? fmt.height : null;
      const qualityLabel = height
        ? `${height}p`
        : fmt.format_note || fmt.resolution || fmt.format_id;
      const ext = (fmt.ext || "bin").toLowerCase();
      const sizeLabel = formatBytes(estimatedBytes);
      const fullLabel = `${qualityLabel} (${ext.toUpperCase()})${sizeLabel ? ` - ${sizeLabel}` : ""}`;
      return {
        formatId: fmt.format_id,
        qualityLabel,
        ext,
        sizeBytes: estimatedBytes,
        sizeLabel,
        fps: Number.isFinite(fmt.fps) ? fmt.fps : null,
        width: Number.isFinite(fmt.width) ? fmt.width : null,
        height,
        fullLabel,
      };
    })
    .sort((a, b) => {
      const ah = a.height || 0;
      const bh = b.height || 0;
      if (ah !== bh) return bh - ah;
      const as = a.sizeBytes || 0;
      const bs = b.sizeBytes || 0;
      return bs - as;
    });
};

const validateRequestUrl = async (url) => {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return { error: "No URL provided", status: 400 };
  }

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { error: "Invalid URL provided", status: 400 };
    }
    const hostname = parsed.hostname.toLowerCase();
    if (!isAllowedHost(hostname)) {
      return { error: "Unsupported host.", status: 403 };
    }
    const lookups = await lookup(hostname, { all: true });
    if (!lookups || lookups.length === 0) {
      return { error: "Unable to resolve host.", status: 400 };
    }
    const blocked = lookups.some((entry) => isPrivateIp(entry.address));
    if (blocked) {
      return { error: "Host is not allowed.", status: 403 };
    }
    return { parsed };
  } catch {
    return { error: "Invalid URL provided", status: 400 };
  }
};

export async function handleInfo(req, res) {
  const { url } = req.body || {};
  const validation = await validateRequestUrl(url);
  if (validation.error) {
    return res.status(validation.status).json({ error: validation.error });
  }

  try {
    const metadata = await getMediaInfo(url);
    const formats = normalizeFormats(metadata?.formats || []);
    const defaultFormatId = formats[0]?.formatId || null;

    return res.json({
      sourceUrl: url,
      title: metadata?.title || "Untitled",
      caption: metadata?.description || "",
      authorName: metadata?.uploader || metadata?.channel || metadata?.creator || "Unknown",
      authorAvatar: metadata?.uploader_avatar || metadata?.channel_favicon || null,
      likes: Number.isFinite(metadata?.like_count) ? metadata.like_count : null,
      comments: Number.isFinite(metadata?.comment_count) ? metadata.comment_count : null,
      views: Number.isFinite(metadata?.view_count) ? metadata.view_count : null,
      duration: Number.isFinite(metadata?.duration) ? metadata.duration : null,
      thumbnail: metadata?.thumbnail || null,
      formats,
      defaultFormatId,
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to load media details.",
    });
  }
}

/**
 * Handle a download request for a media URL and stream the resulting file to the client.
 *
 * Validates the `url` from `req.body`, invokes the media download process, locates the processed file
 * in the local `tmp` directory, sets appropriate response headers (`Content-Disposition`, `Content-Type`, `Content-Length`),
 * and streams the file to the response. Cleans up the file after streaming completes or on stream error.
 *
 * Responds with:
 * - 400 when `url` is missing or invalid,
 * - 500 when the download fails, the processed file cannot be found, or streaming fails.
 */
export async function handleDownload(req, res) {
  const { url, formatId, jobId: requestedJobId } = req.body || {};
  const validation = await validateRequestUrl(url);
  if (validation.error) {
    return res.status(validation.status).json({ error: validation.error });
  }

  const jobId =
    typeof requestedJobId === "string" && requestedJobId.trim() !== ""
      ? requestedJobId.trim()
      : uuidv4();
  res.setHeader("X-Download-Job-Id", jobId);

  try {
    const outputPathStem = await downloadMediaWithOptions({
      url,
      formatId,
      onSpawn: (proc, ctx) => {
        activeDownloads.set(jobId, {
          process: proc,
          outputPath: ctx.outputPath,
          tmpDir: ctx.tmpDir,
        });
      },
    });
    const tmpDir = TMP_DIR;
    const files = fs.readdirSync(tmpDir);
    const stemBase = path.basename(outputPathStem);
    const candidates = files.filter((file) => file.startsWith(stemBase));
    const extRank = { ".mp4": 4, ".webm": 3, ".mp3": 2, ".m4a": 1 };
    const streamFragmentPattern = /\.f\d+\./i;
    const matchedFilename = candidates
      .sort((a, b) => {
        const aFragment = streamFragmentPattern.test(a) ? 1 : 0;
        const bFragment = streamFragmentPattern.test(b) ? 1 : 0;
        if (aFragment !== bFragment) return aFragment - bFragment;
        const aExt = path.extname(a).toLowerCase();
        const bExt = path.extname(b).toLowerCase();
        const aRank = extRank[aExt] || 0;
        const bRank = extRank[bExt] || 0;
        if (aRank !== bRank) return bRank - aRank;
        const aSize = fs.statSync(path.join(tmpDir, a)).size;
        const bSize = fs.statSync(path.join(tmpDir, b)).size;
        return bSize - aSize;
      })[0];

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
      candidates.forEach((file) => cleanupFile(path.join(tmpDir, file)));
    };

    try {
      await pipeline(fs.createReadStream(fullFilePath), res);
    } catch (error) {
      console.error("Stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream file." });
      }
    } finally {
      activeDownloads.delete(jobId);
      doCleanup();
      cleanupStaleTmpFiles(tmpDir);
    }
  } catch (error) {
    const job = activeDownloads.get(jobId);
    activeDownloads.delete(jobId);
    if (job?.outputPath && job?.tmpDir) {
      cleanupStemFiles(job.tmpDir, path.basename(job.outputPath));
      cleanupStaleTmpFiles(job.tmpDir);
    }
    if (error?.message?.includes("terminated")) {
      return res.status(499).json({ error: "Download canceled." });
    }
    console.error("Download error:", error);
    return res.status(500).json({
      error: "Download failed. The link may be invalid, private or unsupported.",
    });
  }
}

export async function handleCancelDownload(req, res) {
  const { jobId } = req.body || {};
  if (!jobId || typeof jobId !== "string") {
    return res.status(400).json({ error: "No jobId provided." });
  }

  const job = activeDownloads.get(jobId);
  if (!job) {
    return res.status(404).json({ error: "No active download found for this job." });
  }

  try {
    job.process.kill("SIGKILL");
  } catch {
    // no-op
  }

  const stemBase = path.basename(job.outputPath || "");
  activeDownloads.delete(jobId);
  if (stemBase) {
    setTimeout(() => {
      cleanupStemFiles(job.tmpDir || TMP_DIR, stemBase);
      cleanupStaleTmpFiles(job.tmpDir || TMP_DIR);
    }, 2000);
  }
  return res.json({ success: true });
}
