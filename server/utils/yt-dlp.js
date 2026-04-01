import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export function downloadMedia(url) {
	return new Promise((resolve, reject) => {
		const filename = `cliprr-${uuidv4()}`;
		const tmpDir = path.resolve("tmp");

		if (!fs.existsSync(tmpDir)) {
			fs.mkdirSync(tmpDir, { recursive: true });
		}

		const outputPath = path.join(tmpDir, filename);
		const args = [
			url,
			"-f",
			"bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
			"-o",
			`${outputPath}.%(ext)s`,
			"--no-playlist",
			"--no-warnings",
			"--quiet",
		];

		const ytDlp = spawn("yt-dlp", args);

		let stderr = "";
		ytDlp.stderr.on("data", (data) => {
			stderr += data.toString();
		});

		ytDlp.on("error", () => {
			reject("yt-dlp not found. Make sure it is installed on the server.");
		});

		ytDlp.on("close", (code) => {
			if (code === 0) {
				resolve(outputPath);
			} else {
				reject(stderr.trim() || "yt-dlp failed with an unknown error.");
			}
		});
	});
}

export function cleanupFile(filePath) {
	try {
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	} catch (error) {
		// Ignore cleanup errors to avoid crashing the server
	}
}
