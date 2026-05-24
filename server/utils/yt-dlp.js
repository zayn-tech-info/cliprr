import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

const binDir = path.resolve("bin");
const isWindows = os.platform() === "win32";
const bundledBinaryPath = path.join(binDir, isWindows ? "yt-dlp.exe" : "yt-dlp");
let ensureBinaryPromise = null;

async function ensureBundledYtDlp() {
	if (fs.existsSync(bundledBinaryPath)) {
		return bundledBinaryPath;
	}

	if (ensureBinaryPromise) {
		return ensureBinaryPromise;
	}

	ensureBinaryPromise = (async () => {
		if (!fs.existsSync(binDir)) {
			fs.mkdirSync(binDir, { recursive: true });
		}

		const downloadUrl = isWindows
			? "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
			: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";

		const response = await fetch(downloadUrl);
		if (!response.ok) {
			throw new Error(`Unable to download yt-dlp binary (${response.status}).`);
		}

		const arrayBuffer = await response.arrayBuffer();
		fs.writeFileSync(bundledBinaryPath, Buffer.from(arrayBuffer));

		if (!isWindows) {
			fs.chmodSync(bundledBinaryPath, 0o755);
		}

		return bundledBinaryPath;
	})();

	try {
		return await ensureBinaryPromise;
	} finally {
		ensureBinaryPromise = null;
	}
}

/**
 * Download media from the given URL using yt-dlp and save it to a generated file in the local `tmp` directory.
 * The downloader prefers MP4 video + M4A audio and writes to a filename based on a UUID.
 * @param {string} url - The media URL to download.
 * @returns {string} The generated base output path (absolute) for the downloaded file without its extension.
 */
export function downloadMedia(url) {
	return downloadMediaWithOptions({ url });
}

/**
 * Download media from URL with optional format selection and spawn hook.
 *
 * @param {{url: string, formatId?: string, onSpawn?: (proc: import('child_process').ChildProcessWithoutNullStreams, ctx: { outputPath: string, tmpDir: string }) => void}} options
 * @returns {Promise<string>}
 */
export function downloadMediaWithOptions(options) {
	return new Promise((resolve, reject) => {
		(async () => {
			const { url, formatId, onSpawn } = options || {};
			const filename = `cliprr-${uuidv4()}`;
			const tmpDir = path.resolve("tmp");

			if (!fs.existsSync(tmpDir)) {
				fs.mkdirSync(tmpDir, { recursive: true });
			}

			const outputPath = path.join(tmpDir, filename);
			const selectedFormat = formatId && typeof formatId === "string" ? formatId : "best[ext=mp4]/best";
			const args = [
				url,
				"-f",
				selectedFormat,
				"-o",
				`${outputPath}.%(ext)s`,
				"--no-playlist",
				"--no-warnings",
				"--quiet",
			];

			let ytDlpCommand = "yt-dlp";
			try {
				ytDlpCommand = await ensureBundledYtDlp();
			} catch (downloadErr) {
				reject(downloadErr?.message || "Unable to prepare yt-dlp binary.");
				return;
			}

			const ytDlp = spawn(ytDlpCommand, args);
			if (typeof onSpawn === "function") {
				onSpawn(ytDlp, { outputPath, tmpDir });
			}

			const timeoutMs = 8 * 60 * 1000; // 8 minutes watchdog
			const timer = setTimeout(async () => {
				ytDlp.kill("SIGKILL");
				try {
					const stemPath = `${outputPath}`;
					if (fs.existsSync(stemPath)) fs.unlinkSync(stemPath);
					const files = fs.readdirSync(tmpDir).filter((file) => file.startsWith(path.basename(outputPath)));
					files.forEach((file) => {
						const full = path.join(tmpDir, file);
						if (fs.existsSync(full)) fs.unlinkSync(full);
					});
				} catch {
					// ignore cleanup errors on timeout
				}
				reject("Download timed out. Please try again with a shorter video or try later.");
			}, timeoutMs);

			let stderr = "";
			ytDlp.stderr.on("data", (data) => {
				stderr += data.toString();
			});

			ytDlp.on("error", () => {
				clearTimeout(timer);
				reject("yt-dlp not found. Make sure it is installed on the server.");
			});

			ytDlp.on("close", (code, signal) => {
				clearTimeout(timer);
				if (code === 0) {
					resolve(outputPath);
					return;
				}
				if (signal) {
					reject(`Download process terminated (${signal}).`);
					return;
				}
				reject(stderr.trim() || "yt-dlp failed with an unknown error.");
			});
		})().catch((error) => {
			reject(error?.message || "Unexpected download setup failure.");
		});
	});
}

/**
 * Fetch metadata and format options for a media URL.
 *
 * @param {string} url
 * @returns {Promise<object>}
 */
export function getMediaInfo(url) {
	return new Promise((resolve, reject) => {
		(async () => {
			let ytDlpCommand = "yt-dlp";
			try {
				ytDlpCommand = await ensureBundledYtDlp();
			} catch (error) {
				reject(error?.message || "Unable to prepare yt-dlp binary.");
				return;
			}

			const args = [url, "--dump-single-json", "--no-warnings", "--no-playlist"];
			const ytDlp = spawn(ytDlpCommand, args);
			let stdout = "";
			let stderr = "";

			ytDlp.stdout.on("data", (data) => {
				stdout += data.toString();
			});
			ytDlp.stderr.on("data", (data) => {
				stderr += data.toString();
			});
			ytDlp.on("error", () => {
				reject("yt-dlp not found. Make sure it is installed on the server.");
			});
			ytDlp.on("close", (code) => {
				if (code !== 0) {
					reject(stderr.trim() || "Failed to fetch media info.");
					return;
				}
				try {
					resolve(JSON.parse(stdout));
				} catch {
					reject("Failed to parse media metadata response.");
				}
			});
		})().catch((error) => {
			reject(error?.message || "Unexpected metadata setup failure.");
		});
	});
}

/**
 * Delete the file at the given path if it exists; suppresses any errors.
 *
 * @param {string} filePath - Path to the file to remove. Errors during deletion are ignored to avoid crashing the server.
 */
export function cleanupFile(filePath) {
	try {
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	} catch (error) {
		// Ignore cleanup errors to avoid crashing the server
	}
}
